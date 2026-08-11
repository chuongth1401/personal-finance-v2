import { InsightSeverity } from '../enums/insight-severity.enum';
import { InsightType } from '../enums/insight-type.enum';

export interface InsightResponse {
  id: string;
  userId: string;
  categoryId: string | null;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  relatedTransactionIds: string[];
  periodStart: Date | null;
  periodEnd: Date | null;
  isRead: boolean;
  createdAt: Date;
}
