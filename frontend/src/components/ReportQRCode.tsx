import React from "react";
import * as QRCode from "qrcode.react";
import { ExternalLink, FileText } from "lucide-react";

interface ReportQRCodeProps {
  url: string;
}

const ReportQRCode: React.FC<ReportQRCodeProps> = ({ url }) => (
  <div className="panel-tight">
    <div className="flex items-center gap-2 mb-4">
      <FileText size={18} className="text-slate-600" />
      <h3 className="text-sm font-semibold text-slate-700">Compartilhamento</h3>
    </div>
    
    <div className="flex flex-col items-center space-y-4">
      <div className="rounded-2xl border border-slate-200 p-3 bg-white">
        <QRCode.QRCodeSVG value={url} size={120} level="M" />
      </div>
      
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-2">QR Code para acesso público</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ExternalLink size={14} />
          Abrir relatório
        </a>
      </div>
    </div>
  </div>
);

export default ReportQRCode;
