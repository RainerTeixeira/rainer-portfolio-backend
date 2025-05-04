export function formatDate(date: Date): string {
    // Retorna no formato YYYY-MM-DD HH:mm:ss (sem milissegundos)
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return (
        date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + ' ' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds())
    );
}
