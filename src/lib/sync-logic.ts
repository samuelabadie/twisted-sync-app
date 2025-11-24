import { Service } from '../types';

export class SyncLogic {
  /**
   * Groups services by parent_key and calculates final values for each row.
   * Returns a map where key is parent_key and value is list of processed services (parent + options).
   * Groups services by webflow_slug and calculates final values for each row.
   * Returns a map where key is webflow_slug and value is list of processed services (parent + options).
   */
  static processServices(rows: Service[]): Map<string, Service[]> {
    const parents = new Map<string, Service>();
    const options: Service[] = [];
    const processed = new Map<string, Service[]>();

    // 1. Separate parents and options based on Option_Extra_Slug
    for (const row of rows) {
      if (!row.webflow_slug) continue; // Skip empty rows

      if (!row.option_extra_slug) {
        // It's a Parent
        parents.set(row.webflow_slug, row);
      } else {
        // It's an Option
        options.push(row);
      }
    }

    // 2. Process parents first
    for (const [slug, parent] of parents) {
      // Parent final values are its base values
      parent.final_price = parent.price_eur;
      parent.final_duration_min = parent.duration_minutes;

      const group = [parent];
      processed.set(slug, group);
    }

    // 3. Process options
    for (const option of options) {
      const parent = parents.get(option.webflow_slug);
      if (!parent) {
        console.warn(`Option at row ${option.rowIndex} (slug: ${option.webflow_slug}) has no matching parent row.`);
        continue;
      }

      // Calculate final values inheriting from parent
      option.final_price = parent.price_eur + (option.option_extra_price || 0);
      option.final_duration_min = parent.duration_minutes + (option.option_extra_duration || 0);

      // Add to the group
      const group = processed.get(option.webflow_slug);
      if (group) {
        group.push(option);
      }
    }

    return processed;
  }
}
