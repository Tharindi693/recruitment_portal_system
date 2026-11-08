import React, { useState } from "react";
import * as XLSX from "xlsx";
import { DataGrid } from "@mui/x-data-grid";
import {
    Box,
    Typography,
    Input,
    Stack,
    Alert,
} from "@mui/material";

export default function WP2ExactPreviewGrid() {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");

    // Define exact columns based on Excel table structure
    const columns = [
        { field: "no", headerName: "No", width: 60 },
        { field: "agmSec", headerName: "AGM SEC.", width: 100 },
        { field: "dgmUnit", headerName: "DGM UNIT", width: 100 },
        { field: "jobCode", headerName: "JOB CODE", width: 100 },
        { field: "client", headerName: "CLIENT", width: 160 },
        { field: "description", headerName: "DESCRIPTION", flex: 1, minWidth: 250 },
        { field: "balanceAsAt", headerName: "BALANCE AS AT\n31.12.2023", width: 150 },
        { field: "y2023", headerName: "0 - 1 YEAR\n2023", width: 130 },
        { field: "y2022", headerName: "1 - 2 YEAR\n2022", width: 130 },
        { field: "y2021", headerName: "2 - 3 YEAR\n2021", width: 130 },
        { field: "y2020", headerName: "3 - 4 YEAR\n2020", width: 130 },
        { field: "y2019", headerName: "4 - 5 YEAR\n2019", width: 130 },
        { field: "upto2018", headerName: "OVER 5 YEARS\nUPTO 2018", width: 150 },
    ];

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError("");
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets["WP2"];

                if (!sheet) {
                    setError("Sheet 'WP2' not found.");
                    return;
                }

                const allRows = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: "",
                });

                // Find the header row (starts with "No", "AGM SEC.", etc.)
                const startIndex = allRows.findIndex(row =>
                    row.includes("No") && row.includes("AGM SEC.")
                );

                if (startIndex === -1) {
                    setError("Data header row not found.");
                    return;
                }

                // Extract rows from the table (until "Total" or blank row)
                const filteredRows = [];
                for (let i = startIndex + 1; i < allRows.length; i++) {
                    const row = allRows[i];

                    // Stop at "Total" or blank row
                    if (
                        row.some(cell => typeof cell === "string" && cell.toLowerCase().includes("total")) ||
                        row.every(cell => cell === "")
                    ) {
                        break;
                    }

                    if (row.length >= 13) {
                        filteredRows.push({
                            id: i,
                            no: row[0],
                            agmSec: row[1],
                            dgmUnit: row[2],
                            jobCode: row[3],
                            client: row[4],
                            description: row[5],
                            balanceAsAt: row[6],
                            y2023: row[7],
                            y2022: row[8],
                            y2021: row[9],
                            y2020: row[10],
                            y2019: row[11],
                            upto2018: row[12],
                        });
                    }
                }

                setRows(filteredRows);
            } catch (err) {
                console.error(err);
                setError("Could not process Excel file.");
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Upload and Preview WP2 Table (Exact Format)
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Input
                    type="file"
                    inputProps={{ accept: ".xlsx,.xls" }}
                    onChange={handleFileUpload}
                />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                />
            </Box>
        </Box>
    );
}
