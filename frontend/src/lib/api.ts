const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  traffic_source: string;
  offer_name: string;
  geo: string;
  currency: string;
  status: string;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetrics {
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  spend: number | string;
  revenue: number | string;
  profit: number | string;
  roi: number | string | null;
  roas: number | string | null;
  ctr: number | string | null;
  cpm: number | string | null;
  cpc: number | string | null;
  cpl: number | string | null;
  cpa: number | string | null;
  cr: number | string | null;
  epc: number | string | null;
}

export interface CampaignAnalytics {
  campaign_id: string;
  metrics: AnalyticsMetrics;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}${endpoint}`,
    {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getCampaign(campaignId: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/api/v1/campaigns/${campaignId}`);
}

export function getCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>("/api/v1/campaigns/");
}

export type CampaignCreate = {
  name: string;
  traffic_source: string;
  offer_name: string;
  geo: string;
  currency: string;
  status: string;
  start_date: string | null;
};

export type CampaignUpdate = Partial<CampaignCreate>;

export async function createCampaign(
  data: CampaignCreate
): Promise<Campaign> {
  return apiFetch<Campaign>("/api/v1/campaigns/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(
  campaignId: string,
  data: CampaignUpdate
): Promise<Campaign> {
  return apiFetch<Campaign>(
    `/api/v1/campaigns/${campaignId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteCampaign(
  campaignId: string
): Promise<void> {
  await apiFetch<void>(`/api/v1/campaigns/${campaignId}`, {
    method: "DELETE",
  });
}

export function getCampaignAnalytics(
  campaignId: string
): Promise<CampaignAnalytics> {
  return apiFetch<CampaignAnalytics>(
    `/api/v1/campaigns/${campaignId}/analytics/`
  );
}

export interface ProfitOverTimePoint {
  date: string;
  spend: number | string;
  revenue: number | string;
  profit: number | string;
}

export interface ProfitOverTimeResponse {
  data: ProfitOverTimePoint[];
}

export function getProfitOverTime(): Promise<ProfitOverTimeResponse> {
  return apiFetch<ProfitOverTimeResponse>(
    "/api/v1/analytics/profit-over-time/"
  );
}

export function getGeoPerformance(
  filters: GeoPerformanceFilters = {}
): Promise<GeoPerformanceResponse> {
  const params = new URLSearchParams();

  if (filters.date_from) {
    params.set("date_from", filters.date_from);
  }

  if (filters.date_to) {
    params.set("date_to", filters.date_to);
  }

  const query = params.toString();

  return apiFetch<GeoPerformanceResponse>(
    `/api/v1/analytics/geo-performance/${query ? `?${query}` : ""}`
  );
}

export interface GeoPerformancePoint extends AnalyticsMetrics {
  geo: string;
  currency: string;
  campaign_count: number;
}

export interface GeoPerformanceResponse {
  date_from: string | null;
  date_to: string | null;
  data: GeoPerformancePoint[];
}

export interface GeoPerformanceFilters {
  date_from?: string;
  date_to?: string;
}


export interface CampaignStat {
  id: string;
  campaign_id: string;
  stat_date: string;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  spend: number | string;
  revenue: number | string;
  created_at: string;
  updated_at: string;
}

export type CampaignStatCreate = {
  stat_date: string;
  impressions?: number;
  clicks?: number;
  leads?: number;
  conversions?: number;
  spend?: number;
  revenue?: number;
};

export type CampaignStatUpdate = Partial<CampaignStatCreate>;

export function getCampaignStats(campaignId: string): Promise<CampaignStat[]> {
  return apiFetch<CampaignStat[]>(
    `/api/v1/campaigns/${campaignId}/stats/`
  );
}

export function createCampaignStat(
  campaignId: string,
  data: CampaignStatCreate
): Promise<CampaignStat> {
  return apiFetch<CampaignStat>(
    `/api/v1/campaigns/${campaignId}/stats/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function updateCampaignStat(
  campaignId: string,
  statId: string,
  data: CampaignStatUpdate
): Promise<CampaignStat> {
  return apiFetch<CampaignStat>(
    `/api/v1/campaigns/${campaignId}/stats/${statId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteCampaignStat(
  campaignId: string,
  statId: string
): Promise<void> {
  await apiFetch<void>(
    `/api/v1/campaigns/${campaignId}/stats/${statId}`,
    {
      method: "DELETE",
    }
  );
}
