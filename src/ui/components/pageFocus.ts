export const APP_NAME = 'Ako';

/** Browser tab title for a screen: its main heading, then the app name. */
export function pageTitle(heading: string | null | undefined): string {
  const text = heading?.replace(/\s+/g, ' ').trim();
  return text ? `${text} | ${APP_NAME}` : APP_NAME;
}

export function mainElement(): HTMLElement | null {
  return document.querySelector('main');
}

/** Move keyboard and screen reader focus to the page content. Used by the skip link. */
export function focusMain(): void {
  const main = mainElement();
  if (!main) return;
  main.setAttribute('tabindex', '-1');
  main.focus();
}
