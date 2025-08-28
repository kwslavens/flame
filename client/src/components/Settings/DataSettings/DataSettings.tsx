import React, { useState, Fragment, ChangeEvent } from 'react';
import axios from 'axios';

// UI Components
import { Button, SettingsHeadline, InputGroup, Message } from '../../UI';

// Utility
import { applyAuth } from '../../../utility';

interface ImportOptions {
  format: 'json' | 'html';
  clearExisting: boolean;
  skipDuplicates: boolean;
  importApps: boolean;
  importBookmarks: boolean;
  importCategories: boolean;
}

interface ImportResult {
  success: boolean;
  imported: {
    apps: number;
    categories: number;
    bookmarks: number;
  };
  skipped: {
    apps: number;
    categories: number;
    bookmarks: number;
  };
  errors: string[];
}

export const DataSettings = (): JSX.Element => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    clearExisting: false,
    skipDuplicates: true,
    importApps: true,
    importBookmarks: true,
    importCategories: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-detect format based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'html' || extension === 'htm') {
        setImportOptions(prev => ({ ...prev, format: 'html' }));
      } else if (extension === 'json') {
        setImportOptions(prev => ({ ...prev, format: 'json' }));
      }
    }
  };

  const handleOptionChange = (key: keyof ImportOptions, value: any) => {
    setImportOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (format: 'json' | 'html') => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.get(`/api/export/${format}`, {
        responseType: 'blob',
        headers: applyAuth()
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const filename = format === 'json' 
        ? `flame-backup-${date}.json`
        : `flame-bookmarks-${date}.html`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Export completed successfully! Downloaded as ${filename}`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Export failed: ${error.response?.data?.error || error.message}`
      });
    }

    setLoading(false);
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setImportResult(null);

    try {
      const fileContent = await importFile.text();
      
      const response = await axios.post('/api/import', {
        format: importOptions.format,
        data: fileContent,
        options: {
          clearExisting: importOptions.clearExisting,
          skipDuplicates: importOptions.skipDuplicates,
          importApps: importOptions.importApps,
          importBookmarks: importOptions.importBookmarks,
          importCategories: importOptions.importCategories,
        }
      }, {
        headers: applyAuth()
      });

      if (response.data.success) {
        setImportResult(response.data.data);
        setMessage({
          type: 'success',
          text: 'Import completed successfully!'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Import failed: ${error.response?.data?.error || error.message}`
      });
    }

    setLoading(false);
  };

  return (
    <Fragment>
      {/* EXPORT SECTION */}
      <SettingsHeadline text="Export Data" />
      <p>Export your apps, bookmarks, and categories for backup or migration.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <Button
          click={() => handleExport('json')}
          disabled={loading}
          style={{ marginRight: '10px' }}
        >
          Export as JSON (Complete Backup)
        </Button>
        <Button
          click={() => handleExport('html')}
          disabled={loading}
        >
          Export as HTML (Browser Compatible)
        </Button>
      </div>

      {/* IMPORT SECTION */}
      <SettingsHeadline text="Import Data" />
      <p>Import data from Flame JSON backups or browser bookmark HTML files.</p>

      <InputGroup>
        <label htmlFor="importFile">Select file to import</label>
        <input
          type="file"
          id="importFile"
          accept=".json,.html,.htm"
          onChange={handleFileChange}
          disabled={loading}
        />
        {importFile && (
          <span style={{ fontSize: '0.9em', color: '#666' }}>
            Selected: {importFile.name} (Auto-detected format: {importOptions.format.toUpperCase()})
          </span>
        )}
      </InputGroup>

      <InputGroup>
        <label htmlFor="importFormat">Import format</label>
        <select
          id="importFormat"
          value={importOptions.format}
          onChange={(e) => handleOptionChange('format', e.target.value)}
          disabled={loading}
        >
          <option value="json">Flame JSON (Complete restore)</option>
          <option value="html">Browser HTML (Bookmarks only)</option>
        </select>
      </InputGroup>

      <SettingsHeadline text="Import Options" />
      
      <InputGroup>
        <label>
          <input
            type="checkbox"
            checked={importOptions.clearExisting}
            onChange={(e) => handleOptionChange('clearExisting', e.target.checked)}
            disabled={loading}
          />
          Clear all existing data before import (⚠️ This will delete everything!)
        </label>
      </InputGroup>

      <InputGroup>
        <label>
          <input
            type="checkbox"
            checked={importOptions.skipDuplicates}
            onChange={(e) => handleOptionChange('skipDuplicates', e.target.checked)}
            disabled={loading}
          />
          Skip duplicates (recommended)
        </label>
      </InputGroup>

      {importOptions.format === 'json' && (
        <Fragment>
          <InputGroup>
            <label>What to import:</label>
            <label style={{ marginLeft: '20px' }}>
              <input
                type="checkbox"
                checked={importOptions.importApps}
                onChange={(e) => handleOptionChange('importApps', e.target.checked)}
                disabled={loading}
              />
              Apps
            </label>
            <label style={{ marginLeft: '20px' }}>
              <input
                type="checkbox"
                checked={importOptions.importCategories}
                onChange={(e) => handleOptionChange('importCategories', e.target.checked)}
                disabled={loading}
              />
              Categories
            </label>
            <label style={{ marginLeft: '20px' }}>
              <input
                type="checkbox"
                checked={importOptions.importBookmarks}
                onChange={(e) => handleOptionChange('importBookmarks', e.target.checked)}
                disabled={loading}
              />
              Bookmarks
            </label>
          </InputGroup>
        </Fragment>
      )}

      <Button
        click={handleImport}
        disabled={loading || !importFile}
        style={{ marginTop: '20px' }}
      >
        {loading ? 'Importing...' : 'Import Data'}
      </Button>

      {/* MESSAGES */}
      {message && (
        <div style={{ marginTop: '20px' }}>
          <Message type={message.type}>{message.text}</Message>
        </div>
      )}

      {/* IMPORT RESULTS */}
      {importResult && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h4>Import Results:</h4>
          <p><strong>Imported:</strong></p>
          <ul>
            <li>Apps: {importResult.imported.apps}</li>
            <li>Categories: {importResult.imported.categories}</li>
            <li>Bookmarks: {importResult.imported.bookmarks}</li>
          </ul>
          
          {(importResult.skipped.apps > 0 || importResult.skipped.categories > 0 || importResult.skipped.bookmarks > 0) && (
            <Fragment>
              <p><strong>Skipped (duplicates):</strong></p>
              <ul>
                <li>Apps: {importResult.skipped.apps}</li>
                <li>Categories: {importResult.skipped.categories}</li>
                <li>Bookmarks: {importResult.skipped.bookmarks}</li>
              </ul>
            </Fragment>
          )}

          {importResult.errors.length > 0 && (
            <Fragment>
              <p><strong>Errors:</strong></p>
              <ul>
                {importResult.errors.map((error, idx) => (
                  <li key={idx} style={{ color: 'red' }}>{error}</li>
                ))}
              </ul>
            </Fragment>
          )}
        </div>
      )}

      {/* HELP TEXT */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
        <h4>Help & Tips:</h4>
        <ul>
          <li><strong>JSON Export:</strong> Creates a complete backup including all metadata, perfect for Flame-to-Flame migrations</li>
          <li><strong>HTML Export:</strong> Creates browser-compatible bookmark files that can be imported into Chrome, Firefox, Safari, etc.</li>
          <li><strong>HTML Import:</strong> Import bookmark files exported from any major browser</li>
          <li><strong>JSON Import:</strong> Restore from Flame backups with full data integrity</li>
          <li><strong>Duplicate Handling:</strong> When "Skip duplicates" is enabled, items with the same name and URL are skipped</li>
        </ul>
      </div>
    </Fragment>
  );
};