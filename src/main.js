import './style.css';
import { initUI } from './ui.js';
import { initMarkdown } from './markdown.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('ResumeFlow initialized');
  initUI();
  initMarkdown();
});