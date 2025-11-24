import { SyncLogic } from '../src/lib/sync-logic';
import { Service } from '../src/types';

describe('SyncLogic', () => {
  it('should correctly group parent and options and calculate prices', () => {
    const rows: Service[] = [
      {
        webflow_slug: 'haircut',
        service_name: 'Haircut',
        price_eur: 50,
        duration_minutes: 30,
        visible: true,
        rowIndex: 2,
      },
      {
        webflow_slug: 'haircut',
        service_name: 'Shampoo',
        option_extra_slug: 'shampoo',
        option_extra_price: 10,
        option_extra_duration: 15,
        price_eur: 0, // Should be ignored
        duration_minutes: 0, // Should be ignored
        visible: true,
        rowIndex: 3,
      },
    ];

    const result = SyncLogic.processServices(rows);

    expect(result.size).toBe(1);
    const services = result.get('haircut');
    expect(services).toBeDefined();
    expect(services?.length).toBe(2);

    // Check Parent
    const parent = services![0];
    expect(parent.final_price).toBe(50);
    expect(parent.final_duration_min).toBe(30);

    // Check Option
    const option = services![1];
    expect(option.final_price).toBe(60); // 50 + 10
    expect(option.final_duration_min).toBe(45); // 30 + 15
  });

  it('should handle options with missing parent gracefully', () => {
    const rows: Service[] = [
      {
        webflow_slug: 'missing',
        service_name: 'Orphan',
        option_extra_slug: 'orphan',
        price_eur: 0,
        duration_minutes: 0,
        visible: true,
        rowIndex: 2,
      },
    ];

    const result = SyncLogic.processServices(rows);
    expect(result.size).toBe(0);
  });
});
