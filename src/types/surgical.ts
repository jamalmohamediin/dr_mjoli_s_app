export interface PortMarking {
  id: string;
  type: 'port';
  x: number;
  y: number;
  size: '5mm' | '10/11mm' | '12mm' | '15mm';
}

export interface StomaMarking {
  id: string;
  type: 'stoma';
  x: number;
  y: number;
  stomaType: 'ileostomy' | 'colostomy';
}

export interface IncisionMarking {
  id: string;
  type: 'incision';
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export type SurgicalMarking = PortMarking | StomaMarking | IncisionMarking;