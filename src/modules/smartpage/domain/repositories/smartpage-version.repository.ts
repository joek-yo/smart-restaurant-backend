export abstract class SmartPageVersionRepository {
  abstract findById(id: string): Promise<any>;
  abstract save(version: any): Promise<any>;
}
