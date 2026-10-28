import {
  ArrowUpRight,
  Bell,
  Box,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  Mail,
  MessageCircle,
  ChevronDown,
  CircleDollarSign,
  Clock,
  House,
  Info,
  Lock,
  LogOut,
  type LucideProps,
  PanelLeft,
  Package,
  Plus,
  Receipt,
  Search,
  Store,
  Settings,
  TrendingUp,
  Upload,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";

// Los íconos de la app tienen nombre propio (en español); acá se decide cuál de Lucide es cada uno.
const iconos = {
  inicio: House,
  productos: Package,
  pedidos: Receipt,
  clientes: Users,
  ganancia: TrendingUp,
  ajustes: Settings,
  mas: Plus,
  check: Check,
  exito: CircleCheck,
  alerta: CircleAlert,
  info: Info,
  salir: LogOut,
  candado: Lock,
  correo: Mail,
  chat: MessageCircle,
  tienda: Store,
  subir: Upload,
  reloj: Clock,
  caja: Box,
  camion: Truck,
  moneda: CircleDollarSign,
  x: X,
  buscar: Search,
  camara: Camera,
  campana: Bell,
  flecha: ChevronDown,
  diagonal: ArrowUpRight,
  usuario: User,
  panel: PanelLeft,
} as const;

export type NombreIcono = keyof typeof iconos;

export function Icon({
  nombre,
  className = "size-6",
  ...props
}: { nombre: NombreIcono } & LucideProps) {
  const Componente = iconos[nombre];
  return <Componente aria-hidden="true" strokeWidth={1.75} className={className} {...props} />;
}
