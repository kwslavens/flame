const asyncWrapper = require('../../middleware/asyncWrapper');
const App = require('../../models/App');
const Bookmark = require('../../models/Bookmark');
const Category = require('../../models/Category');
const { sequelize } = require('../../db');
const loadConfig = require('../../utils/loadConfig');

// @desc      Import data from JSON or HTML
// @route     POST /api/import
// @access    Private
const importData = asyncWrapper(async (req, res, next) => {
  const { format, data, options = {} } = req.body;
  const { pinCategoriesByDefault: pinCategories } = await loadConfig();
  
  if (!['json', 'html'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid import format. Use "json" or "html"'
    });
  }

  if (!data) {
    return res.status(400).json({
      success: false,
      error: 'No data provided'
    });
  }

  const {
    clearExisting = false,
    skipDuplicates = true,
    importApps = true,
    importBookmarks = true,
    importCategories = true
  } = options;

  let importResult = {
    success: true,
    imported: {
      apps: 0,
      categories: 0,
      bookmarks: 0
    },
    skipped: {
      apps: 0,
      categories: 0, 
      bookmarks: 0
    },
    errors: []
  };

  // Use transaction for data integrity
  const transaction = await sequelize.transaction();

  try {
    if (clearExisting) {
      // Clear existing data in proper order (bookmarks first due to foreign keys)
      await Bookmark.destroy({ where: {}, transaction });
      await App.destroy({ where: {}, transaction });
      await Category.destroy({ where: {}, transaction });
    }

    if (format === 'json') {
      await importFromJSON(data, importResult, transaction, {
        skipDuplicates,
        importApps,
        importBookmarks, 
        importCategories,
        pinCategories
      });
    } else if (format === 'html') {
      await importFromHTML(data, importResult, transaction, {
        skipDuplicates,
        importBookmarks,
        importCategories,
        pinCategories
      });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: importResult
    });

  } catch (error) {
    await transaction.rollback();
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function importFromJSON(data, result, transaction, options) {
  const { skipDuplicates, importApps, importBookmarks, importCategories, pinCategories } = options;
  
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { apps = [], categories = [], bookmarks = [] } = parsedData.data || parsedData;

    // Import categories first (bookmarks depend on them)
    if (importCategories) {
      for (const categoryData of categories) {
        try {
          const existingCategory = skipDuplicates ? 
            await Category.findOne({ where: { name: categoryData.name }, transaction }) : 
            null;

          if (existingCategory) {
            result.skipped.categories++;
          } else {
            await Category.create({
              name: categoryData.name,
              isPinned: categoryData.isPinned !== undefined ? categoryData.isPinned : pinCategories,
              orderId: categoryData.orderId,
              isPublic: categoryData.isPublic !== undefined ? categoryData.isPublic : 1
            }, { transaction });
            result.imported.categories++;
          }
        } catch (error) {
          result.errors.push(`Category "${categoryData.name}": ${error.message}`);
        }
      }
    }

    // Import apps
    if (importApps) {
      for (const appData of apps) {
        try {
          const existingApp = skipDuplicates ? 
            await App.findOne({ where: { name: appData.name, url: appData.url }, transaction }) : 
            null;

          if (existingApp) {
            result.skipped.apps++;
          } else {
            await App.create({
              name: appData.name,
              url: appData.url,
              icon: appData.icon || 'cancel',
              isPinned: appData.isPinned || false,
              orderId: appData.orderId,
              isPublic: appData.isPublic !== undefined ? appData.isPublic : 1,
              description: appData.description || ''
            }, { transaction });
            result.imported.apps++;
          }
        } catch (error) {
          result.errors.push(`App "${appData.name}": ${error.message}`);
        }
      }
    }

    // Import bookmarks
    if (importBookmarks) {
      for (const bookmarkData of bookmarks) {
        try {
          const existingBookmark = skipDuplicates ? 
            await Bookmark.findOne({ where: { name: bookmarkData.name, url: bookmarkData.url }, transaction }) : 
            null;

          if (existingBookmark) {
            result.skipped.bookmarks++;
          } else {
            // Find category by ID or create default
            let categoryId = bookmarkData.categoryId;
            if (categoryId) {
              const category = await Category.findByPk(categoryId, { transaction });
              if (!category) {
                // Create default category if referenced category doesn't exist
                const defaultCategory = await Category.create({
                  name: 'Imported',
                  isPinned: false,
                  isPublic: 1
                }, { transaction });
                categoryId = defaultCategory.id;
              }
            }

            await Bookmark.create({
              name: bookmarkData.name,
              url: bookmarkData.url,
              categoryId: categoryId,
              icon: bookmarkData.icon || '',
              isPublic: bookmarkData.isPublic !== undefined ? bookmarkData.isPublic : 1,
              orderId: bookmarkData.orderId
            }, { transaction });
            result.imported.bookmarks++;
          }
        } catch (error) {
          result.errors.push(`Bookmark "${bookmarkData.name}": ${error.message}`);
        }
      }
    }

  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

async function importFromHTML(data, result, transaction, options) {
  const { skipDuplicates, importBookmarks, importCategories, pinCategories } = options;
  
  try {
    // Simple regex-based HTML parsing for bookmark structure
    // This approach avoids external dependencies and handles basic browser bookmark format
    
    // Create default category for HTML imports
    let defaultCategory = null;
    if (importCategories) {
      const existingDefault = await Category.findOne({ where: { name: 'Imported Bookmarks' }, transaction });
      if (!existingDefault) {
        defaultCategory = await Category.create({
          name: 'Imported Bookmarks',
          isPinned: pinCategories,
          isPublic: 1
        }, { transaction });
        result.imported.categories++;
      } else {
        defaultCategory = existingDefault;
      }
    }

    // Parse HTML bookmark structure using regex patterns
    // Extract folder names (categories) from <H3> tags
    const folderRegex = /<H3[^>]*>([^<]+)<\/H3>/gi;
    const linkRegex = /<A[^>]*HREF=["']([^"']+)["'][^>]*>([^<]+)<\/A>/gi;
    
    // Parse folder structure 
    const sections = data.split(/<H3[^>]*>/i);
    let currentCategoryId = defaultCategory ? defaultCategory.id : null;
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const titleMatch = section.match(/^([^<]+)<\/H3>/i);
      
      if (titleMatch && importCategories) {
        const folderName = titleMatch[1].trim();
        
        const existingCategory = skipDuplicates ? 
          await Category.findOne({ where: { name: folderName }, transaction }) :
          null;
        
        if (existingCategory) {
          currentCategoryId = existingCategory.id;
          result.skipped.categories++;
        } else {
          const newCategory = await Category.create({
            name: folderName,
            isPinned: pinCategories,
            isPublic: 1
          }, { transaction });
          currentCategoryId = newCategory.id;
          result.imported.categories++;
        }
      }
      
      // Extract bookmarks from this section
      let linkMatch;
      while ((linkMatch = linkRegex.exec(section)) !== null) {
        const url = linkMatch[1];
        const name = linkMatch[2].trim();
        
        if (name && url && importBookmarks) {
          try {
            const existingBookmark = skipDuplicates ?
              await Bookmark.findOne({ where: { name, url }, transaction }) :
              null;

            if (existingBookmark) {
              result.skipped.bookmarks++;
            } else {
              await Bookmark.create({
                name,
                url,
                categoryId: currentCategoryId,
                icon: '',
                isPublic: 1,
                orderId: null
              }, { transaction });
              result.imported.bookmarks++;
            }
          } catch (error) {
            result.errors.push(`Bookmark "${name}": ${error.message}`);
          }
        }
      }
    }

    // Handle any links in the first section (before any H3 tags) as uncategorized
    if (sections[0] && importBookmarks) {
      let linkMatch;
      const linkRegexForFirst = /<A[^>]*HREF=["']([^"']+)["'][^>]*>([^<]+)<\/A>/gi;
      
      while ((linkMatch = linkRegexForFirst.exec(sections[0])) !== null) {
        const url = linkMatch[1];
        const name = linkMatch[2].trim();
        
        if (name && url) {
          try {
            const existingBookmark = skipDuplicates ?
              await Bookmark.findOne({ where: { name, url }, transaction }) :
              null;

            if (existingBookmark) {
              result.skipped.bookmarks++;
            } else {
              await Bookmark.create({
                name,
                url,
                categoryId: defaultCategory ? defaultCategory.id : null,
                icon: '',
                isPublic: 1,
                orderId: null
              }, { transaction });
              result.imported.bookmarks++;
            }
          } catch (error) {
            result.errors.push(`Bookmark "${name}": ${error.message}`);
          }
        }
      }
    }

  } catch (error) {
    throw new Error(`HTML parsing failed: ${error.message}`);
  }
}

module.exports = importData;