function User(u_id) {
	this.datas = {
		id: u_id,
		name: '',
		score: 0,
		image: { front: 'basique_front.png', back: 'basique.png' }
	};
	this.room = '';
}


module.exports = User;