 // ready
 // 页面进入之后，进行一次渲染操作
 _$(() => {
     const attachedFun = (ele) => {
         if (ele[ATTACHED_KEY]) {
             return;
         }
         let tagdata = getTagData(ele);
         tagdata.attached && tagdata.attached(createShearObject(ele));
         ele[ATTACHED_KEY] = 1;
     }

     const detachedFunc = (ele) => {
         // 确认是移出 document 的元素
         if (ele.getRootNode() != document) {
             let tagdata = getTagData(ele);
             tagdata.detached && tagdata.detached(createShearObject(ele));

             // 防止内存不回收
             // 清除svParent
             _$('[xv-content]', ele).each((i, e) => {
                 delete e.svParent;
             });

             // 清空observer属性
             let xvData = ele[XHEAROBJKEY];

             if (xvData) {
                 xvData.__obs && xvData.__obs.disconnect();
                 delete xvData.__obs;
                 delete ele[XHEAROBJKEY];
             }
         }
     }

     // attached detached 监听
     let observer = new MutationObserver((mutations) => {
         mutations.forEach((e) => {
             let {
                 addedNodes,
                 removedNodes
             } = e;

             // 监听新增元素
             if (addedNodes && 0 in addedNodes) {
                 each(addedNodes, (ele) => {
                     if (ele[XHEAROBJKEY]) {
                         attachedFun(ele);
                     }

                     if (ele instanceof Element) {
                         // 触发已渲染的attached
                         each(ele.querySelectorAll('[xv-render]'), e => {
                             attachedFun(e);
                         });
                     }
                 });
             }

             // 监听去除元素
             if (removedNodes && 0 in removedNodes) {
                 each(removedNodes, (ele) => {
                     if (ele[XHEAROBJKEY]) {
                         detachedFunc(ele);
                     }

                     _$('[xv-render]', ele).each((i, e) => {
                         detachedFunc(e);
                     });
                 });
             }
         });
     });
     observer.observe(document.body, {
         attributes: false,
         childList: true,
         characterData: false,
         subtree: true,
     });

     // 初始渲染一次
     _$('[xv-ele]').each((i, e) => {
         renderEle(e);
     });
 });

 // 初始css
 _$('head').append('<style>[xv-ele]{display:none}</style>');