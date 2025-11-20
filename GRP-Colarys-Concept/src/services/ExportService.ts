// services/ExportService.ts
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Planning } from '@/types/Planning';

export class ExportService {
  static exportToExcel(data: Planning[], filename: string) {
    const worksheet = utils.json_to_sheet(data.map(planning => {
      const row: any = {
        'Agent': planning.agent_name,
        'Semaine': planning.semaine,
        'Total Heures': planning.total_heures,
        'Remarques': planning.remarques || ''
      };

      planning.days.forEach(day => {
        row[day.name] = day.shift;
      });

      return row;
    }));

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Plannings');
    writeFile(workbook, filename);
  }

  static exportToPDF(data: Planning[], filename: string) {
    const doc = new jsPDF();
    
    doc.text('Planning des Agents', 14, 15);
    
    const tableData = data.map(planning => [
      planning.agent_name,
      planning.semaine,
      ...planning.days.map(day => day.shift),
      planning.total_heures.toString(),
      planning.remarques || ''
    ]);

    const headers = [
      'Agent',
      'Semaine',
      ...data[0].days.map(day => day.name),
      'Total Heures',
      'Remarques'
    ];

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 20,
    });

    doc.save(filename);
  }
}