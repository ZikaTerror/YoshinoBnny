// Função de inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Configurações de animação
    const scrollEvents = {
        items: [],
        add: function(config) {
            this.items.push(config);
        },
        init: function() {
            window.addEventListener('scroll', this.handler.bind(this));
            this.handler(); // Executa imediatamente para estado inicial
        },
        handler: function() {
            const height = document.documentElement.clientHeight;
            const top = window.pageYOffset;
            const bottom = top + height;

            this.items.forEach(item => {
                if (!item.element || !item.triggerElement) return;
                
                const rect = item.triggerElement.getBoundingClientRect();
                const elementTop = top + rect.top;
                const elementBottom = elementTop + rect.height;
                
                let state;
                switch(item.mode) {
                    case 1:
                        state = (bottom > (elementTop - item.offset) && top < (elementBottom + item.offset));
                        break;
                    case 2:
                        const center = top + (height * 0.5);
                        state = (center > (elementTop - item.offset) && center < (elementBottom + item.offset));
                        break;
                    case 3:
                        const a = top + (height * item.threshold);
                        const b = top + (height * (1 - item.threshold));
                        state = (b > (elementTop - item.offset) && a < (elementBottom + item.offset));
                        break;
                    case 4:
                    default:
                        const viewportTop = top + (height * item.threshold);
                        const viewportBottom = bottom - (height * item.threshold);
                        state = (
                            (elementTop >= viewportTop && elementBottom <= viewportBottom) ||
                            (elementTop <= viewportTop && elementBottom >= viewportTop) ||
                            (elementBottom >= viewportTop && elementBottom <= viewportBottom)
                        );
                        break;
                }

                if (state !== item.state) {
                    item.state = state;
                    if (state && item.enter) item.enter.call(item.element);
                    if (!state && item.leave) item.leave.call(item.element);
                }
            });
        }
    };

    // Carregar elementos dinâmicos
    const loadElements = (parent = document) => {
        // Carregar iframes
        parent.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.src = iframe.dataset.src;
            iframe.dataset.initialSrc = iframe.dataset.src;
            delete iframe.dataset.src;
        });

        // Iniciar vídeos autoplay
        parent.querySelectorAll('video[autoplay]').forEach(video => {
            if (video.paused) video.play();
        });

        // Foco automático
        const autofocusElement = parent.querySelector('[data-autofocus="1"]');
        if (autofocusElement) {
            const focusable = autofocusElement.querySelector('input, select, textarea');
            if (focusable) focusable.focus();
        }
    };

    // Inicializações
    scrollEvents.init();
    loadElements();

    // Remover classe de loading
    setTimeout(() => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
    }, 1000);
});

// Sistema de animações
const onvisible = {
    effects: {
        'blur-in': {
            rewind: (element, intensity) => {
                element.style.opacity = 0;
                element.style.filter = `blur(${0.25 * intensity}rem)`;
            },
            play: (element) => {
                element.style.opacity = 1;
                element.style.filter = 'none';
            }
        },
        'focus-image': {
            rewind: (element, intensity) => {
                element.style.transform = `scale(${1 + (0.05 * intensity)})`;
                element.style.filter = `blur(${0.25 * intensity}rem)`;
            },
            play: (element) => {
                element.style.transform = 'none';
                element.style.filter = 'none';
            }
        }
    },
    
    add: function(selector, config) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const effect = this.effects[config.style];
            if (!effect) return;

            // Configurar estado inicial
            effect.rewind(element, config.intensity || 5);

            // Adicionar ao scroll events
            scrollEvents.add({
                element: element,
                triggerElement: element.closest('[data-onvisible-trigger]') || element,
                mode: 4,
                threshold: 0.25,
                offset: 0,
                enter: () => effect.play(element),
                leave: config.replay ? () => effect.rewind(element, config.intensity || 5) : null
            });
        });
    }
};

// Ativar animações
onvisible.add('#text03', { 
    style: 'blur-in',
    speed: 1000,
    intensity: 5,
    replay: false
});

onvisible.add('#image02', {
    style: 'focus-image',
    speed: 1000,
    intensity: 5,
    replay: true
});

// Configuração de elementos interativos
document.querySelectorAll('[data-unloaded]').forEach(element => {
    element.addEventListener('loadelements', () => {
        element.removeAttribute('data-unloaded');
    });
});

// Gerenciar redimensionamento
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        scrollEvents.handler();
    }, 250);
});