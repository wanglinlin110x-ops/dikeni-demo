# 本地理解服务

需先打开Ollama并下载`qwen3:4b-instruct-2507-q4_K_M`。
在项目目录运行：

```sh
python3 model-service/server.py --port 8000
```

同一端口同时提供页面和`/api/understand`，手机HTTPS入口应转发到此端口。不要将Ollama的11434端口公开。此服务仅在本机运行，电脑须保持唤醒；GitHub静态页面不会自动获得本地模型能力。

模型只提取意图和限定槽位，不生成业绩数字。原话保持不变。服务故障会明确提示并回退原有演示规则，停止、离开页面和延迟回调均有取消保护。

语音采集和ASR仍沿用浏览器实现，此服务不接收音频。语音服务模型另行接入，不把文本意图测试当作语音识别率。

理解流程：单次模型调用只分类当前意图；程序从原话提取月份、网络、范围、姓名和车型别名，继承可信上下文并检查可用数据。车型简称不会改写可见原话。当前首页人物与旧版区域档案分别保持各自口径，不由模型生成数字。

验收：`python3 tests/model-contract.test.py`；`python3 tests/local-model-eval.py`。真实推理报告输出至`/private/tmp/dikeni-real-model-eval.json`。这些用例通过不表示任意口语或真机ASR识别率达到100%。
