export interface TransportMapMeta {
  mode: string;
  icon: string;
  originIcon: string;
  color: string;
  name: string;
  dashArray: string | null;
  speedKmh: number;
}

export function getTransportMapMeta(mode?: string): TransportMapMeta {
  switch (mode) {
    case 'train':
      return {
        mode: 'train',
        icon: '🚆',
        originIcon: '🚆',
        color: '#059669',
        name: 'High-Speed Rail',
        dashArray: '6, 8',
        speedKmh: 140,
      };
    case 'bus':
      return {
        mode: 'bus',
        icon: '🚌',
        originIcon: '🚌',
        color: '#0d9488',
        name: 'Intercity Bus',
        dashArray: null,
        speedKmh: 75,
      };
    case 'electric_car':
      return {
        mode: 'electric_car',
        icon: '⚡',
        originIcon: '⚡',
        color: '#0891b2',
        name: 'Electric Vehicle',
        dashArray: null,
        speedKmh: 95,
      };
    case 'car':
      return {
        mode: 'car',
        icon: '🚗',
        originIcon: '🚗',
        color: '#d97706',
        name: 'Gasoline Car',
        dashArray: null,
        speedKmh: 95,
      };
    case 'flight':
    default:
      return {
        mode: 'flight',
        icon: '✈️',
        originIcon: '🛫',
        color: '#e11d48',
        name: 'Flight Path',
        dashArray: '8, 8',
        speedKmh: 700,
      };
  }
}
