/**
 * TECNO BRAIN – ARCHITECTURE MODULE
 * File: js/editor/canvas.js
 * Feature: Workspace Transforms, Canvas Pan, Multi-Zoom, Snap-to-Grid & Guidelines Matrix
 * Purpose: Complete low-level engine tracking coordinate space logic for pixel-perfect positioning
 */

import { populateProperties } from './properties.js';

export let zoomLevel = 1;
export let panX = 0;
export let panY = 0;
export const snapGridSize = 8; // Production standard 8px layout baseline alignment matrix

/**
 * Initializes absolute drag spaces, coordinate pan bounds, mousewheel zoom levels,
 * selection bounding boxes, and dynamic alignment guide tracking.
 * @param {Object} editor - The active GrapesJS editor instance
 */
export function initCanvasWorkspace(editor) {
    const canvasArea = document.querySelector('.canvas-wrapper');
    if (!canvasArea) return;

    const frameEl = editor.Canvas.getFrameEl();
    const canvasDoc = editor.Canvas.getDocument();

    frameEl.style.transformOrigin = '0 0';
    frameEl.style.transition = 'none';

    // ==========================================================================
    // 1. MIDDLE MOUSE BUTTON & SPACEBAR WORKSPACE PANNING ENGINE
    // ==========================================================================
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    canvasArea.addEventListener('mousedown', (e) => {
        if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
            isPanning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            canvasArea.style.cursor = 'grabbing';
            e.preventDefault();
            e.stopPropagation();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransformations(frameEl);
    });

    window.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            canvasArea.style.cursor = 'default';
        }
    });

    // ==========================================================================
    // 2. MOUSEWHEEL TRACKPAD ZOOM LAYOUT ENGINE
    // ==========================================================================
    canvasArea.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomFactor = 0.04;
            if (e.deltaY < 0) {
                zoomLevel = Math.min(zoomLevel + zoomFactor, 3.0);
            } else {
                zoomLevel = Math.max(zoomLevel - zoomFactor, 0.25);
            }
            applyTransformations(frameEl);
            updateCanvasStatusLabels(editor);
        }
    }, { passive: false });

    // ==========================================================================
    // 3. SELECTION RECTANGLE DRAG MATRIX (MULTI-SELECT BOUNDS)
    // ==========================================================================
    let isSelecting = false;
    let rectEl = null;
    let sX = 0, sY = 0;

    canvasArea.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target !== canvasArea || e.spaceKey) return;
        isSelecting = true;
        sX = e.clientX;
        sY = e.clientY;

        rectEl = document.createElement('div');
        rectEl.className = 'tb-selection-marquee';
        rectEl.style.position = 'absolute';
        rectEl.style.border = '1px dashed var(--accent-primary, #6366f1)';
        rectEl.style.backgroundColor = 'rgba(99, 102, 241, 0.12)';
        rectEl.style.left = `${sX}px`;
        rectEl.style.top = `${sY}px`;
        rectEl.style.zIndex = '99999';
        rectEl.style.pointerEvents = 'none';
        document.body.appendChild(rectEl);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isSelecting || !rectEl) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(sX, currentX);
        const top = Math.min(sY, currentY);
        const width = Math.abs(sX - currentX);
        const height = Math.abs(sY - currentY);

        rectEl.style.left = `${left}px`;
        rectEl.style.top = `${top}px`;
        rectEl.style.width = `${width}px`;
        rectEl.style.height = `${height}px`;

        evaluateMarqueeIntersections(editor, left, top, width, height);
    });

    window.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            if (rectEl) {
                rectEl.remove();
                rectEl = null;
            }
        }
    });

    // ==========================================================================
    // 4. SMART ALIGNMENT & METRIC GUIDELINE ENGINE HOOKS
    // ==========================================================================
    editor.on('component:drag', (model) => {
        renderSmartGuidelines(editor, model);
        updateCanvasStatusLabels(editor);
    });

    editor.on('component:drag:stop', () => {
        clearSmartGuidelines(editor);
    });
}

/**
 * Applies physical CSS Matrix calculations to update frame boundaries
 * @param {HTMLElement} frameEl - Frame target node references 
 */
function applyTransformations(frameEl) {
    frameEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

/**
 * Quantizes fractional numeric inputs straight to the nearest step size match rule
 * @param {number} value - Relative baseline pixel coordinate value
 * @returns {number} Quantized coordinate value
 */
export function snapToGrid(value) {
    return Math.round(value / snapGridSize) * snapGridSize;
}

/**
 * Calculates intersect hitboxes across components to execute multi-element selection additions
 */
function evaluateMarqueeIntersections(editor, mLeft, mTop, mWidth, mHeight) {
    const wrapper = editor.getWrapper();
    const allModels = wrapper.find('*');
    const selectedArray = [];

    allModels.forEach(model => {
        const view = model.getView();
        if (!view) return;
        const rect = view.el.getBoundingClientRect();

        if (
            rect.left >= mLeft &&
            rect.top >= mTop &&
            rect.right <= (mLeft + mWidth) &&
            rect.bottom <= (mTop + mHeight)
        ) {
            selectedArray.push(model);
        }
    });

    if (selectedArray.length > 0) {
        editor.select(selectedArray);
    }
}

/**
 * Calculates absolute delta proximity values to render horizontal and vertical smart-alignment indicators
 */
function renderSmartGuidelines(editor, targetModel) {
    clearSmartGuidelines(editor);
    const canvasBody = editor.Canvas.getBody();
    const targetEl = targetModel.getView().el;
    const tRect = targetEl.getBoundingClientRect();

    const siblings = targetModel.parent() ? targetModel.parent().components().models : [];
    
    siblings.forEach(sibling => {
        if (sibling === targetModel) return;
        const sEl = sibling.getView().el;
        if (!sEl) return;
        const sRect = sEl.getBoundingClientRect();

        // Check horizontal alignment convergence (X coordinate boundaries)
        if (Math.abs(tRect.left - sRect.left) < 4) {
            createLineIndicator(canvasBody, sEl.offsetLeft, 0, 1, '100%', 'tb-guide-v');
        }
        // Check vertical alignment convergence (Y coordinate boundaries)
        if (Math.abs(tRect.top - sRect.top) < 4) {
            createLineIndicator(canvasBody, 0, sEl.offsetTop, '100%', 1, 'tb-guide-h');
        }
    });
}

function createLineIndicator(parent, x, y, w, h, className) {
    const line = document.createElement('div');
    line.className = `tb-guideline ${className}`;
    line.style.position = 'absolute';
    line.style.backgroundColor = '#ec4899'; // Smart pink guideline alignment accent
    line.style.left = typeof x === 'number' ? `${x}px` : x;
    line.style.top = typeof y === 'number' ? `${y}px` : y;
    line.style.width = typeof w === 'number' ? `${w}px` : w;
    line.style.height = typeof h === 'number' ? `${h}px` : h;
    line.style.zIndex = '9999';
    line.style.pointerEvents = 'none';
    parent.appendChild(line);
}

function clearSmartGuidelines(editor) {
    const canvasDoc = editor.Canvas.getDocument();
    canvasDoc.querySelectorAll('.tb-guideline').forEach(el => el.remove());
}

function updateCanvasStatusLabels(editor) {
    const statusLabel = document.querySelector('.status-bar');
    if (!statusLabel) return;
    const selected = editor.getSelected();
    const name = selected ? selected.get('tagName') || selected.get('type') : 'No Selection';
    
    statusLabel.innerHTML = `
        <div>Canvas Mode: <strong>Absolute Space</strong></div>
        <div>Active: <span style="color:var(--accent-primary); font-weight:600;">${name.toUpperCase()}</span></div>
        <div>Zoom Level: <strong>${Math.round(zoomLevel * 100)}%</strong></div>
    `;
}