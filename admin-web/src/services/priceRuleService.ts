import apiClient from "../api/axiosClient";
import type {
  PriceRuleRequest,
  PriceRuleResponse,
} from "../types/priceRule";

function priceRulesPath(venueId: number, fieldId: number): string {
  return `/api/owner/venues/${venueId}/fields/${fieldId}/price-rules`;
}

export async function getPriceRules(
  venueId: number,
  fieldId: number,
): Promise<PriceRuleResponse[]> {
  const response = await apiClient.get<PriceRuleResponse[]>(
    priceRulesPath(venueId, fieldId),
  );
  return response.data;
}

export async function createPriceRule(
  venueId: number,
  fieldId: number,
  request: PriceRuleRequest,
): Promise<PriceRuleResponse> {
  const response = await apiClient.post<PriceRuleResponse>(
    priceRulesPath(venueId, fieldId),
    request,
  );
  return response.data;
}

export async function updatePriceRule(
  venueId: number,
  fieldId: number,
  ruleId: number,
  request: PriceRuleRequest,
): Promise<PriceRuleResponse> {
  const response = await apiClient.put<PriceRuleResponse>(
    `${priceRulesPath(venueId, fieldId)}/${ruleId}`,
    request,
  );
  return response.data;
}

export async function deletePriceRule(
  venueId: number,
  fieldId: number,
  ruleId: number,
): Promise<void> {
  await apiClient.delete(`${priceRulesPath(venueId, fieldId)}/${ruleId}`);
}