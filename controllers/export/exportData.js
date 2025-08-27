const asyncWrapper = require('../../middleware/asyncWrapper');
const App = require('../../models/App');
const Bookmark = require('../../models/Bookmark');
const Category = require('../../models/Category');
const { Sequelize } = require('sequelize');

// @desc      Export all data
// @route     GET /api/export/:format
// @access    Private
const exportData = asyncWrapper(async (req, res, next) => {
  const { format } = req.params;
  
  if (!['json', 'html'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid export format. Use "json" or "html"'
    });
  }

  // Get all data with proper ordering
  const [apps, categories, bookmarks] = await Promise.all([
    App.findAll({
      order: [['orderId', 'ASC']],
      raw: true
    }),
    Category.findAll({
      order: [['orderId', 'ASC']],
      raw: true
    }),
    Bookmark.findAll({
      order: [['orderId', 'ASC']],
      raw: true
    })
  ]);

  if (format === 'json') {
    // Export as Flame JSON format
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        apps,
        categories,
        bookmarks
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="flame-backup-${new Date().toISOString().split('T')[0]}.json"`);
    
    return res.status(200).json(exportData);
  }

  if (format === 'html') {
    // Export as browser-compatible HTML
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`;

    // Add Apps as a folder
    if (apps.length > 0) {
      html += `
    <DT><H3>Flame Apps</H3>
    <DL><p>`;
      
      apps.forEach(app => {
        const addDate = Math.floor(new Date(app.createdAt).getTime() / 1000);
        html += `
        <DT><A HREF="${app.url}" ADD_DATE="${addDate}">${app.name}</A>`;
      });
      
      html += `
    </DL><p>`;
    }

    // Add Bookmarks organized by categories
    for (const category of categories) {
      const categoryBookmarks = bookmarks.filter(b => b.categoryId === category.id);
      
      if (categoryBookmarks.length > 0) {
        html += `
    <DT><H3>${category.name}</H3>
    <DL><p>`;
        
        categoryBookmarks.forEach(bookmark => {
          const addDate = Math.floor(new Date(bookmark.createdAt).getTime() / 1000);
          html += `
        <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.name}</A>`;
        });
        
        html += `
    </DL><p>`;
      }
    }

    // Add uncategorized bookmarks
    const uncategorizedBookmarks = bookmarks.filter(b => 
      !categories.some(c => c.id === b.categoryId)
    );
    
    if (uncategorizedBookmarks.length > 0) {
      html += `
    <DT><H3>Uncategorized</H3>
    <DL><p>`;
      
      uncategorizedBookmarks.forEach(bookmark => {
        const addDate = Math.floor(new Date(bookmark.createdAt).getTime() / 1000);
        html += `
        <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.name}</A>`;
      });
      
      html += `
    </DL><p>`;
    }

    html += `
</DL><p>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="flame-bookmarks-${new Date().toISOString().split('T')[0]}.html"`);
    
    return res.status(200).send(html);
  }
});

module.exports = exportData;