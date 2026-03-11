export interface AircraftSummary {
  aircraftId: number;
  tailNumber: string;
  instanceType: string;
  makeModelId: number;
  categoryClassId: number;
  model: string;
  modelName: string | null;
  typeName: string | null;
  manufacturer: string;
  categoryClass: string;
  defaultImage?: string | null;
  hideFromSelection?: boolean;
}

export interface UpdateAircraftRequest {
  manufacturerName: string;
  modelName: string;
  categoryClassId: number;
  instanceType?: string;
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
