Component({
	data: {
		active: 0,
		list: [
			{
				icon: 'chat-o',
				text: '杂谈',
				url: '/pages/talk/talk'
			},
			{
				icon: 'service-o',
				text: '服务',
				url: '/pages/service/service'
			},
			{
				icon: 'diamond-o',
				text: '技巧',
				url: '/pages/tip/tip'
			},
			{
				icon: 'home-o',
				text: '我的',
				url: '/pages/home/home'
			}
		]
	},

	methods: {
		onChange(event) {
			let that=this;
			wx.switchTab({
				url: that.data.list[event.detail].url
			});
		},

		init() {
			//console.log(getCurrentPages());
			const page = getCurrentPages().pop();
			
			this.setData({
				active: this.data.list.findIndex(item => item.url === `/${page.route}`)
			});
		}
	}
});
