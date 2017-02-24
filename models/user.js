function User(u_id) {
	this.datas = {
		id: u_id,
		name: '',
		score: 0,
		image: 'basique.png'
	};
	this.room = '';
}


module.exports = User;