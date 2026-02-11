// ==UserScript==
// @name         OpenJudge-Art
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  给 OpenJudge 平台添加暗色主题 - 可开关版 - 带 KaTeX 公式渲染 - One Dark Pro 代码高亮
// @author       GitHub Copilot
// @match        *://*.openjudge.cn/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // One Dark Pro 风格的语法高亮 CSS
    const oneDarkProCss = `
        /* Highlight.js Theme - One Dark Pro (Enhanced for Python) */
        .hljs { color: #abb2bf; background: #282c34; display: block; overflow-x: auto; padding: 0.5em; }
        .hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
        
        /* Purple: Keywords (def, if, return) */
        .hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
        
        /* Red: Variables, tags, deleted */
        .hljs-variable, .hljs-template-variable, .hljs-tag, .hljs-name, .hljs-selector-id, .hljs-selector-class, .hljs-regexp, .hljs-deletion { color: #e06c75; }
        
        /* Orange: Numbers, types, params */
        .hljs-number, .hljs-preprocessor, .hljs-pragma, .hljs-type, .hljs-params { color: #d19a66; }
        
        /* Yellow/Gold: Built-ins (print, len), Classes */
        .hljs-built_in, .hljs-title.class_, .hljs-class .hljs-title { color: #e6c07b; }
        
        /* Green: Strings */
        .hljs-string, .hljs-symbol, .hljs-bullet, .hljs-addition, .hljs-attribute { color: #98c379; }
        
        /* Blue: Functions, Sections, Attributes */
        .hljs-section, .hljs-title, .hljs-attr, .hljs-subst { color: #61afef; }
        
        /* Cyan: Literals */
        .hljs-literal { color: #56b6c2; }

        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
    `;

    const darkCss = `
        /* 1. 全局基础设定 - 统一使用纯黑底色 */
        /* 特别注意：#siteBody 是 OpenJudge 这里的 body ID，权重很高，必须单独覆盖 */
        html, body, #siteBody, #wrapper, .wrap {
            background: #1e1e1e !important; /* 使用缩写属性，同时覆盖颜色和图片 */
            color: #d4d4d4 !important;
            min-height: 100vh !important; /* 确保高度铺满 */
        }

        /* 2. 暴力去白 - 这里的核心是使用 background 而不是 background-color 
           这样可以把背景图片（渐变色、白底图）也一起干掉 */
        div, p, span, ul, ol, li, dl, dt, dd, form, table, tr, td, th, 
        h1, h2, h3, h4, h5, h6,
        header, footer, nav, aside, section, article {
            background: transparent !important;
            color: inherit;
            border-color: #333 !important;
            text-shadow: none !important; /* 去除文字阴影，防止白字在白底上 */
        }

        /* 3. 针对性修复 - 顶部导航栏 */
        #header, #top, #siteHeader, .top-bar, #usrbar, #user-status, .branding, .user-bar {
            background-color: #1e1e1e !important;
            background-image: none !important; /* 确保去除背景图 */
            border-bottom: 1px solid #333 !important;
        }
        
        /* 强力修复 header 内部的顽固白块 */
        #siteHeader *, .top-bar *, #header * {
            background-color: transparent !important;
            background-image: none !important;
        }

        /* 专门处理伪元素（有些网站用伪元素做背景装饰） */
        #siteHeader::before, #siteHeader::after,
        #header::before, #header::after,
        .wrapper::before, .wrapper::after {
             background: transparent !important;
             border: none !important;
        }

        /* 如果顶部有图片横幅（Banner），尝试反色或者隐藏 */
        #siteHeader img, #header img {
            /* 如果图片本身是白底的 logo/banner，变暗处理 */
            /* filter: brightness(0.8); */ 
        }

        /* 补充：针对 wrapper 类的通用处理，防止背景图残留 */
        .wrapper, #wrapper {
            background: #1e1e1e !important; /* 强制背景色并覆盖背景图 */
        }
        
        /* 修复"我的小组"、"最近提交"这些板块标题可能出现的白底 */
        .portlet-title, .box-title, .panel-heading, .block-title, caption {
            background: #252526 !important;
            border-bottom: 1px solid #333 !important;
            color: #ececec !important;
        }

        /* 4. 链接颜色 - 保持高亮 */
        a, a:link, a:visited {
            color: #569cd6 !important;
            text-decoration: none;
        }
        a:hover {
            color: #9cdcfe !important;
            background-color: #2d2d2d !important; /* 鼠标悬停加一点点背景反馈 */
            text-decoration: underline;
        }

        /* 5. 题目和内容区域 - 移除之前的灰色背景，改为纯黑或透明 */
        .main-content, .container, .problem-content {
             background-color: transparent !important;
             border: none !important;
             color: #d4d4d4 !important; /* 强制父容器文字颜色 */
        }
        
        /* 强力修复：题目描述文案看不清的问题 
           很多题目描述是直接复制粘贴的，带有 style="color: black" 的内联样式 
           或者嵌套在 dt, dd, p 标签里 
           注意：这里只针对题目区域，不能全局覆盖 span，否则会破坏代码高亮 */
        .problem-content *, .description *, dd, dt {
             color: #d4d4d4 !important;
             background-color: transparent !important;
        }
        
        /* 额外针对 p 标签，但排除代码块内部 */
        p:not(pre p) {
            color: inherit;
        }

        /* 6. 代码显示优化 - 这里使用 One Dark Pro 配色，覆盖 highlight.js 的基础样式 */
        pre, code, .prettyprint {
            font-family: Consolas, "Courier New", monospace !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
        }

        /* 覆盖代码容器背景，确保与 One Dark Pro 一致 */
        pre {
             background-color: #282c34 !important;
             border: 1px solid #3e3e42 !important;
             padding: 10px !important;
             border-radius: 6px;
             color: #abb2bf !important;
        }
        
        /* 行内代码 */
        p code, li code {
            background-color: #282c34 !important;
            color: #e06c75 !important; /* One Dark 红色 */
            padding: 2px 4px;
            border-radius: 3px;
        }

        /* 输入框、文本域 */
        input[type="text"], 
        input[type="password"], 
        textarea, 
        select {
            background-color: #3c3c3c !important;
            color: #cccccc !important;
            border: 1px solid #3e3e42 !important;
            padding: 5px;
        }

        /* 按钮 */
        button, input[type="submit"], input[type="button"], .btn {
            background-color: #0e639c !important;
            color: #ffffff !important;
            border: 1px solid #0e639c !important;
            border-radius: 2px;
            cursor: pointer;
        }
        button:hover, input[type="submit"]:hover {
            background-color: #1177bb !important;
        }

        /* 特殊处理 OpenJudge 可能存在的特定 ID 或 Class */
        /* 例如题目描述区域 */
        .problem-content {
             background-color: #252526 !important;
             padding: 15px;
        }

        /* 嵌入 One Dark CSS 规则 */
        ${oneDarkProCss}
    `;

    // ========== 核心逻辑修改：由自动加载改为由开关控制 ==========

    const STYLE_ID = 'openjudge-dark-mode-style';
    const STORAGE_KEY = 'openjudge_dark_mode_switch';

    // 1. 定义应用和移除样式的函数
    function toggleStyle(enable) {
        const existingNode = document.getElementById(STYLE_ID);
        if (enable) {
            if (!existingNode) {
                const styleNode = document.createElement('style');
                styleNode.id = STYLE_ID;
                styleNode.type = 'text/css';
                styleNode.innerHTML = darkCss;
                document.head.appendChild(styleNode);
            }
        } else {
            if (existingNode) {
                existingNode.remove();
            }
        }
    }

    // 2. 初始化：立即读取状态并应用（防止页面闪烁）
    // 如果本地存储没有记录，默认为开启 ('on')
    let isDarkMode = localStorage.getItem(STORAGE_KEY) !== 'off';
    toggleStyle(isDarkMode);

    // 3. 创建右下角控制按钮
    function createToggleButton() {
        if (document.getElementById('oj-dark-mode-toggle-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'oj-dark-mode-toggle-btn';
        
        // 设置按钮的样式
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = isDarkMode ? '#e0e0e0' : '#333'; // 按钮颜色与背景反色
        btn.style.color = isDarkMode ? '#333' : '#e0e0e0';
        btn.style.textAlign = 'center';
        btn.style.lineHeight = '40px';
        btn.style.fontSize = '20px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '999999';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        btn.style.userSelect = 'none';
        btn.style.transition = 'all 0.3s';
        
        // 设置初始图标
        btn.innerText = isDarkMode ? '☀️' : '🌙';
        btn.title = isDarkMode ? '关闭暗色模式' : '开启暗色模式';

        // 鼠标悬停效果
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1.0)'; };

        // 点击事件
        btn.onclick = function() {
            isDarkMode = !isDarkMode;
            
            // 切换样式
            toggleStyle(isDarkMode);
            
            // 更新按钮外观
            btn.innerText = isDarkMode ? '☀️' : '🌙';
            btn.style.backgroundColor = isDarkMode ? '#e0e0e0' : '#333';
            btn.style.color = isDarkMode ? '#333' : '#e0e0e0';
            btn.title = isDarkMode ? '关闭暗色模式' : '开启暗色模式';
            
            // 保存状态到本地存储
            localStorage.setItem(STORAGE_KEY, isDarkMode ? 'on' : 'off');
        };

        document.body.appendChild(btn);
    }

    // 4. 将按钮添加到页面
    if (document.body) {
        createToggleButton();
    } else {
        window.addEventListener('DOMContentLoaded', createToggleButton);
    }

    // ========== 新增功能：KaTeX 公式渲染 ==========
    function enableKatexRendering() {
        if (!document.getElementById('katex-css')) {
            const link = document.createElement('link');
            link.id = 'katex-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
        }

        const renderMath = () => {
            if (typeof renderMathInElement === 'function' && document.body) {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '\\[', right: '\\]', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false}
                    ],
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
                    throwOnError: false
                });
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderMath);
        } else {
            renderMath();
        }
    }

    // ========== 新增功能：Highlight.js 代码高亮 (C++ / Python) ==========
    function enableCodeHighlighting() {
        const highlightCode = () => {
             // 1. 查找所有 pre 标签
             // OpenJudge 可能使用 pre, pre.prettyprint
             const blocks = document.querySelectorAll('pre');
             
             blocks.forEach(block => {
                 // 如果已经被 highlight.js 处理过，跳过
                 if (block.classList.contains('hljs')) return;

                 // 2. 尝试获取纯文本内容，移除可能存在的旧 spans
                 // 注意：如果直接 innerText 可能会丢失格式，textContent 比较安全
                 // 但如果在“查看代码”页面，可能已经有 prettify 的 html 标签了
                 // 我们选择简单的自动检测与覆盖
                 
                 // 自动检测语言，如果没指定，HLJS 会尽力猜
                 // 对于 OpenJudge，通常不需要手动指定类名，HLJS auto-detect 效果通常不错
                 // 如果想强制支持 C++/Python，可以在 auto-detect 中体现
                 
                 // 处理 pre 内部
                 // 如果 pre 内部没有 code 标签，highlight.js 推荐包裹一层
                 // 但 highlightElement 也可以直接作用于 dom 元素
                 
                 // 简单清理：移除 prettify 可能留下的 spans，还原为纯文本再高亮
                 // 只有当有 prettyprint 类或者确实是代码块时才做
                 if (block.classList.contains('prettyprint') || block.innerHTML.includes('<span') || block.textContent.length > 20) {
                     // 简单转义防止 XSS 的同时恢复 raw code (HLJS will excape it again)
                     // 更好的方式是让 HLJS 处理
                     hljs.highlightElement(block);
                 }
             });
        };

        // 很多时候 OpenJudge 是动态加载或者 prettify 是后执行的
        // 我们延迟一点执行，或者监听变化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', highlightCode);
        } else {
            // 稍微延迟确保页面原有脚本跑完（如果原有 prettify 跑了，我们再覆盖）
            setTimeout(highlightCode, 500); 
            setTimeout(highlightCode, 1500); // 双保险
        }
    }

    enableKatexRendering();
    enableCodeHighlighting();

})();

