import { INSTAGRAM, linkWhatsApp } from '../config.js';

// Completa los links de redes en todos los lugares donde aparecen
export function iniciarWhatsApp() {
  document.querySelectorAll('[data-whatsapp]').forEach((a) => (a.href = linkWhatsApp()));
  document.querySelectorAll('[data-instagram]').forEach((a) => (a.href = INSTAGRAM));
}
