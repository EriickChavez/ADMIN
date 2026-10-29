import { Trophy, type LucideIcon } from "lucide-react";

interface AppBrandingConfig {
    name: string;
    namePrefix: string;
    nameSuffix: string;
    shortName: string;
    tagline: string;
    logoSrc: string | null;
    logoIcon: LucideIcon;
    colors: {
        primary: string;
        secondary: string;
    };
}

export const APP_BRANDING: AppBrandingConfig = {
    // Nombre completo de la aplicación.
    name: "TournamentHQ",

    // Partes del nombre que se muestran estilizadas en el login.
    namePrefix: "TOURNAMENT",
    nameSuffix: "HQ",

    // Nombre corto para espacios reducidos.
    shortName: "TournamentHQ",

    tagline: "Administración deportiva",

    // null = utilizar el ícono configurado abajo.
    // Para usar una imagen, coloca su ruta, por ejemplo: "/logo.svg".
    logoSrc: null,

    // Ícono predeterminado mientras no haya una imagen.
    logoIcon: Trophy,

    colors: {
        primary: "#2563eb",
        secondary: "#4f46e5",
    },
};