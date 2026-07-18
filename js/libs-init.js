// Helper library initializers and examples
// Contains: fetchFreeVideos, Pickr init, GSAP helper, Three.js cube, Grid.js sample,
// Animate.css hover helper, and Filerobot editor launcher.

(function(global){
    const Toolkit = {
        // جلب فيديوهات مجانية من Pexels (مطلوب مفتاح API)
        async fetchFreeVideos(query = 'background'){
            const resp = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15`, {
                headers: { Authorization: 'YOUR_PEXELS_API_KEY' }
            });
            const data = await resp.json();
            return data.videos || [];
        },

        // Pickr color picker
        initPickr(selector = '.color-picker-button'){
            if (!window.Pickr) return null;
            const pickr = Pickr.create({
                el: selector,
                theme: 'classic',
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: { hex: true, rgba: true, input: true, save: true }
                }
            });
            pickr.on('save', (color) => {
                try{
                    const hex = color.toHEXA().toString();
                    const ws = document.getElementById('workspace');
                    if (ws) ws.style.backgroundColor = hex;
                }catch(e){ console.warn('Pickr save handler', e); }
            });
            global._pickr = pickr;
            return pickr;
        },

        // GSAP simple entrance animation
        animateFrom(selector = '#workspace-item'){
            if (!window.gsap) return;
            gsap.from(selector, { duration: 1, x: -100, opacity: 0, scale: 0.5, ease: 'back' });
        },

        // Three.js cube helper
        create3DCube(containerEl){
            if (!window.THREE || !containerEl) return null;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true });
            renderer.setSize(200, 200);
            containerEl.appendChild(renderer.domElement);
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            camera.position.z = 3;
            function animate(){ requestAnimationFrame(animate); cube.rotation.x += 0.01; cube.rotation.y += 0.01; renderer.render(scene, camera); }
            animate();
            return { scene, camera, renderer, cube };
        },

        // Grid.js sample render
        initGridSample(targetId = 'sheet-container'){
            if (!window.gridjs) return null;
            const el = document.getElementById(targetId);
            if (!el) return null;
            new gridjs.Grid({
                columns: ['الاسم','الوظيفة','الحالة'],
                data: [['يوسف','مهندس برمجيات','نشط'],['أحمد','مصمم','مستعد']],
                search: true,
                sort: true
            }).render(el);
        },

        // Animate.css hover helper
        attachButtonHover(btnId){
            const b = document.getElementById(btnId);
            if (!b) return;
            b.addEventListener('mouseenter', ()=> b.classList.add('animate__animated','animate__pulse'));
            b.addEventListener('mouseleave', ()=> b.classList.remove('animate__animated','animate__pulse'));
        },

        // Filerobot photo editor launcher
        openFilerobotEditor(sourceUrl){
            if (!window.FilerobotImageEditor && !window.FilerobotImageEditorWidget) return null;
            try{
                const editor = new FilerobotImageEditor(document.body, {
                    source: sourceUrl || (document.querySelector('#image-id') ? document.querySelector('#image-id').src : ''),
                    onSave: (imageInfo) => { console.log('Saved image base64 length:', (imageInfo.imageBase64||'').length); }
                });
                editor.render();
                return editor;
            }catch(e){ console.warn('Filerobot init failed', e); return null; }
        }
    };

    global.Toolkit = Toolkit;
})(window);

// Example: attach animate hover to any element with id 'myBtn' automatically (no-op if not found)
document.addEventListener('DOMContentLoaded', ()=>{ try{ if(document.getElementById('myBtn')) window.Toolkit.attachButtonHover('myBtn'); }catch(e){} });
