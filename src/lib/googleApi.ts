import { EquipmentItem, StockLog } from '../types';

/**
 * Interface representing a Google Drive backup file.
 */
export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
}

/**
 * Creates and exports the equipment items into a beautifully formatted Google Sheet.
 * This function returns the URL of the created Spreadsheet.
 */
export async function exportToGoogleSheets(
  accessToken: string,
  items: EquipmentItem[]
): Promise<string> {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Prepare header columns cells
  const headers = [
    'Item ID',
    'Equipment Name',
    'Category',
    'Current Stock',
    'Unit',
    'Cost Per Unit',
    'Total Valuation',
    'Location / Shelf ID',
    'Supplier Info',
    'Last Updated',
    'Management Notes'
  ];

  type SheetValueCell = {
    userEnteredValue: { stringValue?: string; numberValue?: number };
    userEnteredFormat?: any;
  };

  const headerRow: SheetValueCell[] = headers.map(text => ({
    userEnteredValue: { stringValue: text },
    userEnteredFormat: {
      backgroundColor: { red: 0.08, green: 0.08, blue: 0.08 }, // Slate Dark
      horizontalAlignment: 'CENTER',
      textFormat: {
        bold: true,
        fontSize: 10,
        foregroundColor: { red: 0.82, green: 0.69, blue: 0.43 }, // Gold #d2b06b
        fontFamily: 'Arial'
      },
      padding: { top: 8, bottom: 8, left: 6, right: 6 }
    }
  }));

  // Build grid data rows
  const itemRows: SheetValueCell[][] = items.map(item => {
    const totalVal = item.currentStock * item.unitCost;
    return [
      { 
        userEnteredValue: { stringValue: item.id },
        userEnteredFormat: { textFormat: { fontSize: 9, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { stringValue: item.name },
        userEnteredFormat: { textFormat: { bold: true, fontSize: 10, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { stringValue: item.category },
        userEnteredFormat: { textFormat: { fontSize: 10, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { numberValue: item.currentStock },
        userEnteredFormat: { 
          horizontalAlignment: 'RIGHT',
          numberFormat: { type: 'NUMBER', pattern: '#,##0' },
          textFormat: { fontSize: 10, fontFamily: 'Arial' }
        }
      },
      { 
        userEnteredValue: { stringValue: item.unit },
        userEnteredFormat: { horizontalAlignment: 'CENTER', textFormat: { fontSize: 9, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { numberValue: item.unitCost },
        userEnteredFormat: { 
          horizontalAlignment: 'RIGHT',
          numberFormat: { type: 'CURRENCY', pattern: '"Rp"#,##0' },
          textFormat: { fontSize: 10, fontFamily: 'Arial' }
        }
      },
      { 
        userEnteredValue: { numberValue: totalVal },
        userEnteredFormat: { 
          horizontalAlignment: 'RIGHT',
          numberFormat: { type: 'CURRENCY', pattern: '"Rp"#,##0' },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.7, green: 0.55, blue: 0.25 }, fontFamily: 'Arial' } // Darker gold
        }
      },
      { 
        userEnteredValue: { stringValue: item.location },
        userEnteredFormat: { textFormat: { fontSize: 10, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { stringValue: item.supplier || '-' },
        userEnteredFormat: { textFormat: { fontSize: 9, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { stringValue: new Date(item.lastUpdated).toLocaleDateString('id-ID') },
        userEnteredFormat: { horizontalAlignment: 'CENTER', textFormat: { fontSize: 9, fontFamily: 'Arial' } }
      },
      { 
        userEnteredValue: { stringValue: item.notes || '' },
        userEnteredFormat: { textFormat: { fontSize: 9, italic: true, fontFamily: 'Arial' } }
      }
    ];
  });

  // Calculate overall calculations summary
  const totalItemsCount = items.reduce((acc, i) => acc + i.currentStock, 0);
  const aggregateValuation = items.reduce((acc, i) => acc + (i.currentStock * i.unitCost), 0);

  const summaryRowSeparator: SheetValueCell[] = Array(11).fill({
    userEnteredValue: { stringValue: '' },
    userEnteredFormat: { backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 } }
  });

  const totalSummaryRow: SheetValueCell[] = [
    { userEnteredValue: { stringValue: 'SUMMARY' }, userEnteredFormat: { textFormat: { bold: true, fontSize: 10 } } },
    { userEnteredValue: { stringValue: 'Overall Catalog Totals' }, userEnteredFormat: { textFormat: { italic: true, fontSize: 10 } } },
    { userEnteredValue: { stringValue: '' } },
    { 
      userEnteredValue: { numberValue: totalItemsCount }, 
      userEnteredFormat: { horizontalAlignment: 'RIGHT', textFormat: { bold: true }, numberFormat: { type: 'NUMBER', pattern: '#,##0' } }
    },
    { userEnteredValue: { stringValue: 'units' }, userEnteredFormat: { horizontalAlignment: 'CENTER' } },
    { userEnteredValue: { stringValue: 'Average Valuation' } },
    { 
      userEnteredValue: { numberValue: aggregateValuation }, 
      userEnteredFormat: { horizontalAlignment: 'RIGHT', textFormat: { bold: true, foregroundColor: { red: 0.8, green: 0.0, blue: 0.0 } }, numberFormat: { type: 'CURRENCY', pattern: '"Rp"#,##0' } }
    },
    ...Array(4).fill({ userEnteredValue: { stringValue: '' } })
  ];

  const bodyDataRows = [headerRow, ...itemRows, summaryRowSeparator, totalSummaryRow];

  // Request body for sheet creation
  const requestBody = {
    properties: {
      title: `Store Equipment Stock Registry - ${dateStr}`,
    },
    sheets: [
      {
        properties: {
          title: 'Live Inventory Catalog',
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: 2,
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: bodyDataRows.map(row => ({ values: row }))
          }
        ]
      }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets export error: ${response.status} - ${errText}`);
  }

  const resJson = await response.json();
  return resJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${resJson.spreadsheetId}/edit`;
}

/**
 * Creates a backup file (.json) containing App database in the user's Google Drive.
 */
export async function backupToGoogleDrive(
  accessToken: string,
  items: EquipmentItem[],
  logs: StockLog[]
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
  const fileName = `store_equipment_backup_${dateStr}_${timeStr}.json`;

  // Step 1: Create Spreadsheet File Metadata holding ID
  const metaResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: 'application/json',
      description: `Store Equipment stock control database backup created on ${dateStr} at ${timeStr}.`
    })
  });

  if (!metaResponse.ok) {
    const errText = await metaResponse.text();
    throw new Error(`Drive metadata creation failed: ${metaResponse.status} - ${errText}`);
  }

  const metaData = await metaResponse.json();
  const fileId = metaData.id;

  // Step 2: Upload payload media contents to file ID
  const payloadStr = JSON.stringify({ items, logs }, null, 2);
  const mediaResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: payloadStr
  });

  if (!mediaResponse.ok) {
    const errText = await mediaResponse.text();
    throw new Error(`Drive file media content upload failed: ${mediaResponse.status} - ${errText}`);
  }

  return fileName;
}

/**
 * Lists catalog backup files currently existing in Google Drive.
 */
export async function listGoogleDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  const query = "name contains 'store_equipment_backup_' and mimeType = 'application/json' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&orderBy=createdTime%20desc`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed listing Google Drive backups: ${response.status} - ${errText}`);
  }

  const resJson = await response.json();
  return resJson.files || [];
}

/**
 * Downloads backup document from Drive and parses its dataset contents.
 */
export async function downloadDriveBackup(
  accessToken: string,
  fileId: string
): Promise<{ items: EquipmentItem[]; logs: StockLog[] }> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed fetching Drive backup metadata: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      logs: Array.isArray(data.logs) ? data.logs : []
    };
  } else {
    throw new Error('Retrieved backup contains an invalid format configuration.');
  }
}
