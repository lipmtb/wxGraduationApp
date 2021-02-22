# 钓鱼助手小程序
- angler：用户数据库
- 第一个是杂谈:分为钓友圈和问答圈两部分，钓友圈部分（分为钓友圈和热门选项）：（钓友们通过发表文章（图+文字描述）的方式分享自己的钓鱼装备，钓鱼收获，钓鱼经历等，其他钓友们可以对发布的文章进行评论，点赞，收藏或者分享）；热门（讨论多的文章升级为热门并展示前面，显示前两条，可以通过更多展开）；问答圈：垂钓者发布图文问题，其他钓友们进行评论，点赞，收藏或者分享。(相关数据库：talk,comment,likeTalk,collectTalk,question,collectQuestion,questionComment,likeQuestionComment,questionCommentReply)

- 第二个是服务：分为天气服务，钓点服务，装备服务。
天气服务提供当地最近几天的天气情况，并分析钓鱼指数（分析当天是否适合出行钓鱼）。
钓点服务：用户可以发布自家钓点的介绍（显示简介和位置信息，收费方式，联系方式，评分等），钓友们可以提前线上预约钓点（提供多个时间段），同时推荐钓点附近渔具店，钓具店，烧烤店，饭店等等，并且用户可以对钓点进行评分和评论。
装备服务：用户可以发布自己的钓鱼装备（鱼竿、鱼线轮、鱼 钩、鱼线、鱼饵、鱼漂，帐篷、睡袋、烧烤炉、 折叠桌椅、运动水壶，钓装、背心、帐篷、 伞、休闲椅或者其他，显示发布者的位置信息和发布时间，联系方式等），同时对其发布的钓鱼装备进行备注和说明，其他用户可以与之进行协商租用钓鱼装备，并且能够对发布的装备进行评论。

- 第三个是技巧：钓鱼水域位置分析，钓具介绍，饵料分析，打窝技巧，夜钓，冬钓等文章。
(tipClassify(技巧主题分类)，topicRelevant(由一个主题导引入另一个主题),readTopic（阅读主题）)
tipEssays技巧类帖子，tipComment技巧类帖子评论，likeTip点赞帖子,collectTip收藏帖子



- 第四个是我的，有我的预约（钓点预约，装备预约），我的收藏（收藏的钓友圈文章，问答圈文章，技巧部分的文章，钓点，装备），我的日记（记录自己的钓鱼经历），消息（钓点预约，装备预约等消息，系统通知等），用户反馈（用户可以此小程序进行反馈）。




