import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, BookOpen, Car, Circle, Film, HeartPulse, House, ReceiptText, ShoppingBag, Store, Tag, Utensils, WalletCards } from "lucide-react";

const icons: Record<string, LucideIcon> = { wallet: WalletCards, store: Store, badge: BadgeDollarSign, chart: BadgeDollarSign, circle: Circle, utensils: Utensils, car: Car, receipt: ReceiptText, house: House, shopping: ShoppingBag, heart: HeartPulse, book: BookOpen, film: Film, tag: Tag };

export function CategoryIcon({ iconKey }: { iconKey?: string | null }) {
  const Icon = icons[iconKey ?? "tag"] ?? Tag;
  return <span className="category-icon" aria-hidden="true"><Icon size={16} /></span>;
}
