export interface AircraftSummary {
  aircraftId: number;
  tailNumber: string;
  instanceType: string;
  makeModelId: number;
  model: string;
  modelName: string | null;
  typeName: string | null;
  manufacturer: string;
  categoryClass: string;
}

export interface CategoryClassItem {
  id: number;
  catClass: string;
}

export interface CreateAircraftRequest {
  tailNumber: string;
  manufacturerName: string;
  modelName: string;
  categoryClassId: number;
  instanceType?: string;
}
