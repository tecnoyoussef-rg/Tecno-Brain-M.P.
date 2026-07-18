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

// Enable dragging elements from outside the canvas into the GrapesJS editor.
// Add `class="draggable-source"` to toolbox items and optionally
// set `data-drag-html` to control inserted markup.
export function enableExternalDrag(editor) {
    const container = document.getElementById('gjs') || (editor && editor.getContainer && editor.getContainer());
    if (!container || !editor) return;

    const sources = document.querySelectorAll('.draggable-source, .tool');
    sources.forEach(src => {
        let ghost = null;
        let moveHandler = null;
        let upHandler = null;

        const onMouseDown = (e) => {
            e.preventDefault();

            // Create a floating ghost that follows the cursor
            ghost = src.cloneNode(true);
            ghost.style.position = 'fixed';
            ghost.style.pointerEvents = 'none';
            ghost.style.opacity = '0.9';
            ghost.style.transform = 'translate(-50%,-50%)';
            document.body.appendChild(ghost);

            const updateGhost = (ev) => {
                ghost.style.left = ev.clientX + 'px';
                ghost.style.top = ev.clientY + 'px';
            };

            moveHandler = (ev) => updateGhost(ev);
            window.addEventListener('mousemove', moveHandler);

            upHandler = (ev) => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);

                // Check if dropped inside editor container
                const rect = container.getBoundingClientRect();
                if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                    const left = Math.round(ev.clientX - rect.left);
                    const top = Math.round(ev.clientY - rect.top);
                            const html = src.dataset.dragHtml || src.outerHTML || (src.dataset && src.dataset.type ? `<div data-gjs-type="${src.dataset.type}">${src.innerText || src.dataset.type}</div>` : src.outerHTML);

                    try {
                        const wrapper = editor.DomComponents.getWrapper();
                        wrapper.append({
                            components: html,
                            style: {
                                position: 'absolute',
                                left: `${left}px`,
                                top: `${top}px`,
                                transform: 'translate(-50%, -50%)'
                            }
                        });
                        if (recordState) recordState(editor);
                    } catch (err) {
                        // Fallback to setComponents if append fails
                        try {
                            const wrapped = `<div style="position:absolute; left:${left}px; top:${top}px; transform:translate(-50%,-50%);">${src.dataset.dragHtml || src.outerHTML}</div>`;
                            const existing = editor.getHtml() || '';
                            editor.setComponents(existing + wrapped);
                            if (recordState) recordState(editor);
                        } catch (innerErr) {
                            console.error('Drop into editor failed:', innerErr);
                        }
                    }
                }

                if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
                ghost = null;
            };

            window.addEventListener('mouseup', upHandler);
        };

        src.addEventListener('mousedown', onMouseDown);
    });
}