export const parseDate = (date: string) => new Date(`${date}T00:00:00`);

export const formatDate = (date: string | null) =>
    date
        ? parseDate(date).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "Sin definir";