import { getDateOfTuesday } from './weekUtils';

export const buildOrdersMarkdown = (timeline) => {
    const today = new Date().toLocaleDateString('nl-BE');
    const lines = [`# Bestellingen — ${today}`, ''];

    for (const { weekId, stats } of timeline) {
        lines.push(`## ${getDateOfTuesday(weekId)} (${weekId})`);
        lines.push('');
        lines.push('| Naam | Aantal | Prijs (€) | Weken | Subtotaal (€) |');
        lines.push('|---|---:|---:|---:|---:|');

        if (stats.orders.length > 0) {
            for (const o of stats.orders) {
                const sub = (Number(o.price) || 0) * (o.qty || 0);
                lines.push(`| ${o.name} | ${o.qty} | ${(Number(o.price) || 0).toFixed(2)} | ${o.estDuration || 1} | ${sub.toFixed(2)} |`);
            }
            lines.push(`| **Totaal** | | | | **${stats.orderTotal.toFixed(2)}** |`);
        } else {
            lines.push('| _Geen bestellingen_ | | | | |');
        }
        lines.push('');
    }

    return lines.join('\n');
};

export const downloadOrdersMarkdown = (timeline) => {
    const md = buildOrdersMarkdown(timeline);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `bestellingen_${stamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
