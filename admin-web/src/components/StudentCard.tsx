import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface StudentCardProps {
  student: {
    id?: string;
    name: string;
    studentNumber: string;
    classGroup: string;
    photoUrl?: string;
    balance?: number;
  };
  purchasesCount?: number;
  interactive?: boolean;
  layout?: 'row' | 'col';
  side?: 'front' | 'back' | 'both';
}

export const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  interactive = false,
  layout = 'row',
  side = 'both'
}) => {
  // Extract initials for the monogram signature
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'I P';
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return `${first} ${last}`;
  };

  const initials = getInitials(student.name);

  return (
    <div className={`flex ${layout === 'col' ? 'flex-col' : 'flex-col lg:flex-row'} gap-6 justify-center items-center ${interactive ? 'perspective-container' : ''}`}>
      
      {/* CARD FRENTE (Front) */}
      {(side === 'both' || side === 'front') && (
        <div className="relative w-[380px] h-[220px] bg-[#f8fafc] rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col justify-between p-5 transition-all duration-300 hover:shadow-2xl">
        
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/95 via-white/90 to-white/85 pointer-events-none"></div>

        {/* Top Section: IPOCARD Label & Monogram */}
        <div className="relative z-10 flex justify-between items-start">
          <span className="font-sans font-black text-xl tracking-tight text-brand-dark">
            IPOCARD
          </span>
          
          {/* Monogram Initials */}
          <div className="relative flex flex-col items-end pr-1">
            <span className="font-cursive text-5xl text-brand-royal/80 leading-none select-none rotate-[-6deg] drop-shadow-sm">
              {initials}
            </span>
            <span className="font-sans text-[7px] uppercase tracking-[0.2em] text-slate-400 mt-1">IPOCET</span>
          </div>
        </div>

        {/* Middle Section: Name & Class Group (Spacious and aligned) */}
        <div className="relative z-10 flex flex-col justify-center mt-2">
          <h3 className="font-sans font-extrabold text-[17px] leading-tight text-brand-dark tracking-wide uppercase truncate max-w-[340px]">
            {student.name}
          </h3>
          <span className="font-handwritten text-[12px] text-slate-600 mt-1 truncate max-w-[340px]">
            Turma: {student.classGroup}
          </span>
        </div>

        {/* Bottom Section: Reference & Contacts */}
        <div className="relative z-10 flex justify-between items-end border-t border-slate-200/60 pt-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="font-sans font-semibold">Referência:</span>
              <span className="font-handwritten font-bold tracking-wider text-brand-royal">{student.studentNumber}</span>
            </div>
          </div>

          <div className="flex flex-col items-end text-[7.5px] text-slate-500 font-handwritten">
            <span>CONTACTOS: +244 959 442 870</span>
            <span>E-mail: ae.ipocet@gmail.com</span>
          </div>
        </div>
      </div>
      )}

      {/* CARD VERSO (Back) */}
      {(side === 'both' || side === 'back') && (
        <div className="relative w-[380px] h-[220px] bg-[#f8fafc] rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col justify-center items-center p-4 transition-all duration-300 hover:shadow-2xl">
          
          {/* Subtle Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85 pointer-events-none"></div>

          {/* Back Header */}
          <div className="relative z-10 text-center mb-4">
            <h4 className="font-handwritten text-2xl font-bold text-brand-dark tracking-wide">
              Cartão de Consumo
            </h4>
          </div>

          {/* QR Code Container (Centered) */}
          <div className="relative z-10 p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
            {student.studentNumber ? (
              <QRCodeSVG 
                value={student.studentNumber} 
                size={95}
                bgColor="#ffffff"
                fgColor="#000c3b"
                level="Q"
                includeMargin={false}
              />
            ) : (
              <div className="w-[95px] h-[95px] bg-slate-100 animate-pulse rounded-lg"></div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
