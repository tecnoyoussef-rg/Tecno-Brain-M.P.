/**
 * TECNO BRAIN – ARCHITECTURE MODULE
 * File: js/editor/drag.js
 * Feature: Drag Engine Component Position Logic
 */

import { snapToGrid } from './canvas.js';
import { renderSelectionOverlays } from './selection.js';
import { recordState } from './history.js';

export function initDragEngine(component, overlay, editor) {
    const el = component.getView().el;
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'move';

    overlay.addEventListener('mousedown', (e) => {
        if (e.target !== overlay) return; // Prevent interference from resize handles
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        initialLeft = parseInt(el.style.left) || el.offsetLeft;
        initialTop = parseInt(el.style.top) || el.offsetTop;
        
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Apply grid snapping matrices instantly
        const targetLeft = snapToGrid(initialLeft + dx);
        const targetTop = snapToGrid(initialTop + dy);

        component.addStyle({
            position: 'absolute',
            left: `${targetLeft}px`,
            top: `${targetTop}px`
        });

        renderSelectionOverlays(editor);
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            recordState(editor);
        }
    });
}