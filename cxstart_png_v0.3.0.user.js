// ==UserScript==
// @name         cxstart_png
// @namespace    svipwly.cn
// @version      0.3.0
// @description  按页截图支持“多页选择”格式如1,3,5-7，配合进度条精准导出canvas截图。
// @author       svipwly
// @match        *://*/onlineepub?*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const exportedPages = new Set();

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function capturePage(pageNum) {
    const canvas = document.querySelector(`canvas#pdf-canvas-${pageNum}`);
    if (!canvas) {
      console.warn(`第${pageNum}页 canvas 未找到，等待加载...`);
      return false;
    }
    const dataUrl = canvas.toDataURL('image/png');
    downloadImage(dataUrl, `page_${pageNum}.png`);
    console.log(`第${pageNum}页截图完成`);
    exportedPages.add(pageNum);
    return true;
  }

  async function scrollToPage(pageNum) {
    const pageDiv = document.querySelector(`#page-div-${pageNum}`);
    if (pageDiv) {
      pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo(0, 0);
    }
    await delay(1200);
  }

  async function scrollAndCaptureAll() {
    const totalPageText = document.querySelector('#totalPage')?.innerText;
    const totalPages = parseInt(totalPageText?.replace(/\D/g, '') || '0', 10);
    if (!totalPages) {
      alert('未找到总页码信息，无法执行脚本！');
      return;
    }

    for (let page = 1; page <= totalPages; page++) {
      await scrollToPage(page);
      let success = false;
      for (let tryCount = 0; tryCount < 5; tryCount++) {
        success = await capturePage(page);
        if (success) break;
        await delay(1000);
      }
      if (!success) console.warn(`第${page}页截图失败，跳过`);
    }
    alert('所有页面截图完成！');
  }

  function parsePageInput(input) {
    const pages = new Set();
    const parts = input.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(x => parseInt(x, 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) pages.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) pages.add(num);
      }
    }
    return [...pages].sort((a, b) => a - b);
  }

  async function captureMultiplePages() {
    const input = prompt("请输入要截图的页码（如：1,3,5-7）:");
    if (!input) return;
    const pages = parsePageInput(input);
    if (pages.length === 0) {
      alert("未识别到有效页码！");
      return;
    }

    for (const page of pages) {
      await scrollToPage(page);
      let success = false;
      for (let tryCount = 0; tryCount < 5; tryCount++) {
        success = await capturePage(page);
        if (success) break;
        await delay(1000);
      }
      if (!success) {
        console.warn(`第${page}页截图失败`);
      }
    }

    alert("选定页面截图完成！");
  }

  function createButtons() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const style = `
      padding: 10px 15px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;

    const btnAll = document.createElement('button');
    btnAll.textContent = '📘 导出全书';
    btnAll.setAttribute('style', style);
    btnAll.onclick = scrollAndCaptureAll;

    const btnMulti = document.createElement('button');
    btnMulti.textContent = '📄 截图多页';
    btnMulti.setAttribute('style', style);
    btnMulti.onclick = captureMultiplePages;

    container.appendChild(btnAll);
    container.appendChild(btnMulti);
    document.body.appendChild(container);
  }

  window.addEventListener('load', createButtons);
})();
