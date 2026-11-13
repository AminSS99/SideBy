import type { ComponentType, ReactElement } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowDown as PhArrowDown,
  ArrowCounterClockwise as PhArrowCounterClockwise,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUpRight as PhArrowUpRight,
  ArrowsClockwise as PhArrowsClockwise,
  ArrowsInSimple as PhArrowsInSimple,
  ArrowsLeftRight as PhArrowsLeftRight,
  ArrowsOutSimple as PhArrowsOutSimple,
  Bell as PhBell,
  BellSlash as PhBellSlash,
  BookOpen as PhBookOpen,
  BookOpenText as PhBookOpenText,
  BracketsCurly as PhBracketsCurly,
  Calendar as PhCalendar,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  ChartLineUp as PhChartLineUp,
  ChatCircle as PhChatCircle,
  ChatCircleDots as PhChatCircleDots,
  ChatDots as PhChatDots,
  Chats as PhChats,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Circle as PhCircle,
  CircleNotch as PhCircleNotch,
  ClipboardText as PhClipboardText,
  Clock as PhClock,
  CloudArrowUp as PhCloudArrowUp,
  Code as PhCode,
  Compass as PhCompass,
  Cookie as PhCookie,
  Copy as PhCopy,
  Cpu as PhCpu,
  CreditCard as PhCreditCard,
  Cube as PhCube,
  CurrencyCircleDollar as PhCurrencyCircleDollar,
  CurrencyDollar as PhCurrencyDollar,
  Database as PhDatabase,
  DeviceMobile as PhDeviceMobile,
  Dot as PhDot,
  DotsSixVertical as PhDotsSixVertical,
  DotsThree as PhDotsThree,
  DownloadSimple as PhDownloadSimple,
  EnvelopeSimple as PhEnvelopeSimple,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  FileCode as PhFileCode,
  FileCsv as PhFileCsv,
  FileMagnifyingGlass as PhFileMagnifyingGlass,
  FileText as PhFileText,
  FloppyDisk as PhFloppyDisk,
  FlowArrow as PhFlowArrow,
  Folder as PhFolder,
  FolderLock as PhFolderLock,
  FolderOpen as PhFolderOpen,
  Gauge as PhGauge,
  Gear as PhGear,
  GearSix as PhGearSix,
  GitBranch as PhGitBranch,
  GitDiff as PhGitDiff,
  Globe as PhGlobe,
  GlobeHemisphereWest as PhGlobeHemisphereWest,
  Graph as PhGraph,
  House as PhHouse,
  Info as PhInfo,
  Kanban as PhKanban,
  Key as PhKey,
  Lifebuoy as PhLifebuoy,
  Lightning as PhLightning,
  Link as PhLink,
  LinkBreak as PhLinkBreak,
  List as PhList,
  Lock as PhLock,
  LockKey as PhLockKey,
  MagnifyingGlass as PhMagnifyingGlass,
  Microscope as PhMicroscope,
  Minus as PhMinus,
  Newspaper as PhNewspaper,
  NotePencil as PhNotePencil,
  PaperPlaneTilt as PhPaperPlaneTilt,
  Pause as PhPause,
  PencilSimple as PhPencilSimple,
  Planet as PhPlanet,
  Play as PhPlay,
  Plus as PhPlus,
  PlusSquare as PhPlusSquare,
  Pulse as PhPulse,
  PushPin as PhPushPin,
  Question as PhQuestion,
  Receipt as PhReceipt,
  SealCheck as PhSealCheck,
  Share as PhShare,
  ShareNetwork as PhShareNetwork,
  Shield as PhShield,
  ShieldCheck as PhShieldCheck,
  ShieldWarning as PhShieldWarning,
  Sidebar as PhSidebar,
  SignOut as PhSignOut,
  SkipBack as PhSkipBack,
  SkipForward as PhSkipForward,
  Sliders as PhSliders,
  SlidersHorizontal as PhSlidersHorizontal,
  SpeakerHigh as PhSpeakerHigh,
  SpeakerSlash as PhSpeakerSlash,
  SpinnerGap as PhSpinnerGap,
  SquaresFour as PhSquaresFour,
  Stack as PhStack,
  StackSimple as PhStackSimple,
  Star as PhStar,
  Table as PhTable,
  Tag as PhTag,
  Target as PhTarget,
  TerminalWindow as PhTerminalWindow,
  ThumbsDown as PhThumbsDown,
  ThumbsUp as PhThumbsUp,
  ToggleLeft as PhToggleLeft,
  ToggleRight as PhToggleRight,
  Trash as PhTrash,
  TrendUp as PhTrendUp,
  Trophy as PhTrophy,
  User as PhUser,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  UsersThree as PhUsersThree,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  WebhooksLogo as PhWebhooksLogo,
  WifiSlash as PhWifiSlash,
  X as PhX,
  XCircle as PhXCircle,
  type IconProps as PhosphorProps,
  type IconWeight,
} from "@phosphor-icons/react";
import type { SideByIconProps } from "./BespokeIcons";

export {
  BookOpenCheck,
  Bot,
  ChartNoAxesCombined,
  FileCheck2,
  GitCompare,
  GitCompareArrows,
  Scale,
  SearchCheck,
  Sparkles,
  WandSparkles,
  type SideByIconProps,
} from "./BespokeIcons";

export type SideByIcon = (props: SideByIconProps) => ReactElement;
export type LucideIcon = SideByIcon;

function wrapPhosphor(
  Component: ComponentType<PhosphorProps>,
  defaultWeight: IconWeight = "regular",
  motionClass?: string,
): SideByIcon {
  return function SideByWrappedIcon({
    strokeWidth,
    weight,
    className,
    ...rest
  }: SideByIconProps): ReactElement {
    const numericStroke =
      typeof strokeWidth === "number" ? strokeWidth : Number(strokeWidth);
    const resolvedWeight: IconWeight =
      weight ??
      (Number.isFinite(numericStroke) && numericStroke >= 2 && defaultWeight === "regular"
        ? "bold"
        : defaultWeight);
    return (
      <Component
        weight={resolvedWeight}
        className={cn("shrink-0 sb-icon", motionClass, className)}
        {...(rest as PhosphorProps)}
      />
    );
  };
}

export const Activity = wrapPhosphor(PhPulse, "duotone", "sb-motion-pop");
export const ActivitySquare = wrapPhosphor(PhPulse, "duotone", "sb-motion-pop");
export const AlertCircle = wrapPhosphor(PhWarningCircle, "duotone");
export const AlertTriangle = wrapPhosphor(PhWarning, "duotone");
export const ArrowDown = wrapPhosphor(PhArrowDown, "regular", "sb-motion-down");
export const ArrowLeft = wrapPhosphor(PhArrowLeft, "regular", "sb-motion-left");
export const ArrowLeftRight = wrapPhosphor(PhArrowsLeftRight, "regular", "sb-motion-swap");
export const ArrowRight = wrapPhosphor(PhArrowRight, "regular", "sb-motion-right");
export const ArrowUpRight = wrapPhosphor(PhArrowUpRight, "regular", "sb-motion-upright");
export const BadgeCheck = wrapPhosphor(PhSealCheck, "duotone", "sb-motion-pop");
export const Bell = wrapPhosphor(PhBell, "regular", "sb-motion-bell");
export const BellOff = wrapPhosphor(PhBellSlash);
export const BookOpen = wrapPhosphor(PhBookOpen);
export const BookOpenText = wrapPhosphor(PhBookOpenText, "duotone");
export const Boxes = wrapPhosphor(PhCube, "duotone");
export const Calendar = wrapPhosphor(PhCalendar);
export const Check = wrapPhosphor(PhCheck, "bold");
export const CheckCircle2 = wrapPhosphor(PhCheckCircle, "duotone", "sb-motion-pop");
export const ChevronDown = wrapPhosphor(PhCaretDown, "regular", "sb-motion-down");
export const ChevronLeft = wrapPhosphor(PhCaretLeft, "regular", "sb-motion-left");
export const ChevronRight = wrapPhosphor(PhCaretRight, "regular", "sb-motion-right");
export const ChevronUp = wrapPhosphor(PhCaretUp, "regular", "sb-motion-up");
export const Circle = wrapPhosphor(PhCircle);
export const CircleDollarSign = wrapPhosphor(PhCurrencyCircleDollar, "duotone", "sb-motion-pop");
export const CircleHelp = wrapPhosphor(PhQuestion);
export const Clipboard = wrapPhosphor(PhClipboardText);
export const Clock = wrapPhosphor(PhClock);
export const Clock3 = wrapPhosphor(PhClock);
export const Code = wrapPhosphor(PhCode);
export const Compass = wrapPhosphor(PhCompass, "duotone", "sb-motion-tilt");
export const Cookie = wrapPhosphor(PhCookie, "duotone");
export const Copy = wrapPhosphor(PhCopy, "regular", "sb-motion-pop");
export const Cpu = wrapPhosphor(PhCpu, "duotone");
export const CreditCard = wrapPhosphor(PhCreditCard, "duotone");
export const Database = wrapPhosphor(PhDatabase, "duotone");
export const Diff = wrapPhosphor(PhGitDiff, "regular", "sb-motion-swap");
export const DollarSign = wrapPhosphor(PhCurrencyDollar);
export const Dot = wrapPhosphor(PhDot);
export const Download = wrapPhosphor(PhDownloadSimple, "regular", "sb-motion-down");
export const Edit2 = wrapPhosphor(PhPencilSimple, "regular", "sb-motion-tilt");
export const Edit3 = wrapPhosphor(PhNotePencil, "regular", "sb-motion-tilt");
export const ExternalLink = wrapPhosphor(PhArrowSquareOut, "regular", "sb-motion-upright");
export const Eye = wrapPhosphor(PhEye, "regular", "sb-motion-pop");
export const EyeOff = wrapPhosphor(PhEyeSlash);
export const FileJson = wrapPhosphor(PhFileCode);
export const FileSearch = wrapPhosphor(PhFileMagnifyingGlass, "duotone", "sb-motion-tilt");
export const FileSpreadsheet = wrapPhosphor(PhFileCsv, "duotone");
export const FileText = wrapPhosphor(PhFileText);
export const Folder = wrapPhosphor(PhFolder);
export const FolderKanban = wrapPhosphor(PhKanban, "duotone");
export const FolderLock = wrapPhosphor(PhFolderLock, "duotone");
export const FolderOpen = wrapPhosphor(PhFolderOpen);
export const Gauge = wrapPhosphor(PhGauge, "duotone", "sb-motion-pop");
export const GitBranch = wrapPhosphor(PhGitBranch);
export const Globe = wrapPhosphor(PhGlobe);
export const Globe2 = wrapPhosphor(PhGlobeHemisphereWest, "duotone");
export const Grid2X2 = wrapPhosphor(PhSquaresFour);
export const GripVertical = wrapPhosphor(PhDotsSixVertical);
export const HelpCircle = wrapPhosphor(PhQuestion);
export const Home = wrapPhosphor(PhHouse, "regular", "sb-motion-pop");
export const House = wrapPhosphor(PhHouse, "regular", "sb-motion-pop");
export const Info = wrapPhosphor(PhInfo);
export const Key = wrapPhosphor(PhKey, "duotone", "sb-motion-tilt");
export const KeyRound = wrapPhosphor(PhKey, "regular", "sb-motion-tilt");
export const Layers = wrapPhosphor(PhStack, "duotone", "sb-motion-pop");
export const Layers3 = wrapPhosphor(PhStackSimple, "duotone", "sb-motion-pop");
export const LifeBuoy = wrapPhosphor(PhLifebuoy, "duotone", "sb-motion-tilt");
export const Link2 = wrapPhosphor(PhLink);
export const List = wrapPhosphor(PhList);
export const Loader2 = wrapPhosphor(PhCircleNotch);
export const LoaderCircle = wrapPhosphor(PhSpinnerGap);
export const Lock = wrapPhosphor(PhLock);
export const LockKeyhole = wrapPhosphor(PhLockKey, "duotone");
export const LogOut = wrapPhosphor(PhSignOut, "regular", "sb-motion-right");
export const Mail = wrapPhosphor(PhEnvelopeSimple, "regular", "sb-motion-pop");
export const Maximize = wrapPhosphor(PhArrowsOutSimple, "regular", "sb-motion-pop");
export const Menu = wrapPhosphor(PhList);
export const MessageCircleMore = wrapPhosphor(PhChatCircleDots, "regular", "sb-motion-pop");
export const MessageCircleQuestion = wrapPhosphor(PhChatCircle, "duotone");
export const MessageSquare = wrapPhosphor(PhChatDots);
export const MessageSquarePlus = wrapPhosphor(PhChatDots);
export const MessagesSquare = wrapPhosphor(PhChats, "duotone", "sb-motion-pop");
export const Microscope = wrapPhosphor(PhMicroscope, "duotone", "sb-motion-tilt");
export const Minimize = wrapPhosphor(PhArrowsInSimple);
export const Minus = wrapPhosphor(PhMinus);
export const MoreHorizontal = wrapPhosphor(PhDotsThree);
export const Network = wrapPhosphor(PhGraph, "duotone");
export const Newspaper = wrapPhosphor(PhNewspaper);
export const Orbit = wrapPhosphor(PhPlanet, "duotone", "sb-motion-tilt");
export const PanelLeft = wrapPhosphor(PhSidebar, "regular", "sb-motion-left");
export const Pause = wrapPhosphor(PhPause);
export const Pin = wrapPhosphor(PhPushPin, "regular", "sb-motion-tilt");
export const Play = wrapPhosphor(PhPlay, "regular", "sb-motion-right");
export const Plus = wrapPhosphor(PhPlus, "regular", "sb-motion-pop");
export const PlusSquare = wrapPhosphor(PhPlusSquare, "regular", "sb-motion-pop");
export const Radar = wrapPhosphor(PhTarget, "duotone", "sb-motion-pop");
export const ReceiptText = wrapPhosphor(PhReceipt, "duotone");
export const RefreshCw = wrapPhosphor(PhArrowsClockwise, "regular", "sb-motion-refresh");
export const RotateCcw = wrapPhosphor(PhArrowCounterClockwise, "regular", "sb-motion-rotate-ccw");
export const Save = wrapPhosphor(PhFloppyDisk, "regular", "sb-motion-pop");
export const Search = wrapPhosphor(PhMagnifyingGlass, "regular", "sb-motion-tilt");
export const Send = wrapPhosphor(PhPaperPlaneTilt, "regular", "sb-motion-send");
export const ServerCog = wrapPhosphor(PhGearSix, "duotone", "sb-motion-refresh");
export const Settings = wrapPhosphor(PhGear, "regular", "sb-motion-refresh");
export const Settings2 = wrapPhosphor(PhSlidersHorizontal, "regular", "sb-motion-pop");
export const Share = wrapPhosphor(PhShare, "regular", "sb-motion-upright");
export const Share2 = wrapPhosphor(PhShareNetwork, "regular", "sb-motion-pop");
export const Shield = wrapPhosphor(PhShield);
export const ShieldAlert = wrapPhosphor(PhShieldWarning, "duotone");
export const ShieldCheck = wrapPhosphor(PhShieldCheck, "duotone", "sb-motion-pop");
export const SkipBack = wrapPhosphor(PhSkipBack, "regular", "sb-motion-left");
export const SkipForward = wrapPhosphor(PhSkipForward, "regular", "sb-motion-right");
export const Sliders = wrapPhosphor(PhSliders, "regular", "sb-motion-pop");
export const SlidersHorizontal = wrapPhosphor(PhSlidersHorizontal, "regular", "sb-motion-pop");
export const Smartphone = wrapPhosphor(PhDeviceMobile);
export const Star = wrapPhosphor(PhStar, "regular", "sb-motion-pop");
export const Table2 = wrapPhosphor(PhTable);
export const Tag = wrapPhosphor(PhTag);
export const Terminal = wrapPhosphor(PhTerminalWindow);
export const ThumbsDown = wrapPhosphor(PhThumbsDown, "regular", "sb-motion-tilt");
export const ThumbsUp = wrapPhosphor(PhThumbsUp, "regular", "sb-motion-tilt");
export const ToggleLeft = wrapPhosphor(PhToggleLeft);
export const ToggleRight = wrapPhosphor(PhToggleRight);
export const Trash2 = wrapPhosphor(PhTrash, "regular", "sb-motion-tilt");
export const TrendingUp = wrapPhosphor(PhTrendUp, "duotone", "sb-motion-upright");
export const TriangleAlert = wrapPhosphor(PhWarning, "duotone");
export const Trophy = wrapPhosphor(PhTrophy, "duotone", "sb-motion-pop");
export const Unlink2 = wrapPhosphor(PhLinkBreak);
export const UploadCloud = wrapPhosphor(PhCloudArrowUp, "duotone", "sb-motion-up");
export const User = wrapPhosphor(PhUser);
export const UserPlus = wrapPhosphor(PhUserPlus, "regular", "sb-motion-pop");
export const Users = wrapPhosphor(PhUsers);
export const UsersRound = wrapPhosphor(PhUsersThree);
export const Variable = wrapPhosphor(PhBracketsCurly);
export const Volume2 = wrapPhosphor(PhSpeakerHigh, "regular", "sb-motion-pop");
export const VolumeX = wrapPhosphor(PhSpeakerSlash);
export const Webhook = wrapPhosphor(PhWebhooksLogo, "duotone", "sb-motion-tilt");
export const WifiOff = wrapPhosphor(PhWifiSlash);
export const Workflow = wrapPhosphor(PhFlowArrow, "duotone", "sb-motion-pop");
export const X = wrapPhosphor(PhX);
export const XCircle = wrapPhosphor(PhXCircle);
export const Zap = wrapPhosphor(PhLightning, "duotone", "sb-motion-pop");
export const ChartLineUp = wrapPhosphor(PhChartLineUp, "duotone", "sb-motion-upright");
