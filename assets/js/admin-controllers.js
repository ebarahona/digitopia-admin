(function ($) {
	function adminEditController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.settings = $.extend({
			model: this.element.data('model'),
			searchProperty: this.element.data('search-property'),
			endpoint: this.element.data('endpoint'),
			mode: this.element.data('mode')
		}, options || {});

		this.start = function () {
			this.setUpInputBehavior();

			this.element.on('click', '.list-button', function (e) {
				e.preventDefault();
				loadPage('/admin/views/' + self.settings.model + '/index');
			});

			this.element.on('click', '.download-button', function (e) {
				e.preventDefault();
				document.location.href = '/admin/views/' + self.settings.model + '/index?format=csv';
			});

			this.element.on('click', '.add-button', function (e) {
				e.preventDefault();
				loadPage('/admin/views/' + self.settings.model + '/add');
			});

			this.element.on('click', '.edit-button', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
				loadPage('/admin/views/' + self.settings.model + '/' + id + '/edit');
			});

			this.element.on('click', '.save-button', function (e) {
				e.preventDefault();
				self.save();
			});

			this.element.on('click', '.toggle-admin', function (e) {
				e.preventDefault();
				self.toggleAdmin($(this).data('endpoint'));
			});

			$(this.element.find('.delete-button')).confirmation({
				placement: 'left',
				'onConfirm': function () {
					self.delete();
				}
			});

			$(this.element.find('.delete-relation-button')).confirmation({
				placement: 'left',
				'onConfirm': function (event, element) {
					$(element).closest('form').find('input[name="' + $(element).data('foreign-key') + '"]').val('').attr('value', '');
					$(element).closest('.form-group').find('.parent-relation').empty();
				}
			});

			this.element.on('click', '.search-button', function (e) {
				e.preventDefault();
				var q = self.element.find('[name="q"]').val();
				var query = {
					'property': self.settings.searchProperty,
					'q': q
				};
				loadPage(document.location.pathname + '?' + $.param(query));
			});

			this.element.on('click', '.instance-select', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
				loadPage('/admin/views/' + self.settings.model + '/' + id + '/view')
			});
		};

		this.stop = function () {
			this.element.off('click', '.list-button');
			this.element.off('click', '.download-button');
			this.element.off('click', '.delete-button');
			this.element.off('click', '.edit-button');
			this.element.off('click', '.add-button');
			this.element.off('click', '.save-button');
			this.element.off('click', '.search-button');
			this.element.off('click', '.instance-select');
		};

		this.setUpInputBehavior = function () {
			self.element.find('input,textarea,select').each(function () {

			});
		};

		this.delete = function () {
			$.ajax({
					method: 'delete',
					url: self.settings.endpoint
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/index');
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					var error = jqXHR.responseText;
					flashAjaxStatus('error', 'Could not delete: ' + error);
				})
		};

		this.save = function () {
			var form = {};

			self.element.find('input,textarea,select').each(function () {
				var name = $(this).attr('name');
				if (name) {
					var val = $(this).val() ? $(this).val() : null;
					var datatype = $(this).data('datatype');
					var encode = $(this).data('encode');
					var skip = $(this).data('skip');
					if ($(this).data('value')) {
						val = $(this).data('value');
					}

					if (datatype === 'boolean') {
						val = false;
						if ($(this).is(':checked')) {
							val = true;
						}
					}

					if (!skip) {
						if (datatype === 'array') {
							if (!(name in form)) {
								form[name] = [];
							}
						}

						if (datatype === 'date') {
							val = moment.utc(val, 'YYYY-MM-DD').format('YYYY-MM-DD');
						}

						if (datatype === 'datetime') {
							var sel = '[name="' + name + '-time"]';
							var timePart = self.element.find(sel).val();
							if (timePart) {
								val += '-' + timePart;
								val = moment.utc(val, 'YYYY-MM-DD-hh:mm').format('YYYY-MM-DDThh:mm');
							}
						}

						if (($(this).attr('type') !== 'checkbox' && $(this).attr('type') !== 'radio') || $(this).is(':checked') || datatype === 'boolean') {
							if (encode === 'json') {
								if (val) {
									form[name] = JSON.parse(val);
								}
								else {
									form[name] = null;
								}
							}
							else if (datatype === 'array') {
								form[name].push(val);
							}
							else {
								form[name] = val;
							}
						}
					}
				}
			});

			var method = self.settings.mode === 'edit' ? 'patch' : 'post';

			flashAjaxStatus('info', 'saving...');

			$.ajax({
					method: method,
					url: self.settings.endpoint,
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					data: JSON.stringify(form)
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/' + data.id + '/view');
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					var response = JSON.parse(jqXHR.responseText);
					flashAjaxStatus('danger', 'Could not ' + method + 'instance: ' + response.error.message);
				});
		};

		this.toggleAdmin = function (endpoint) {
			$.ajax({
				method: 'get',
				url: endpoint
			}).done(function (data) {
				$('body').trigger('DigitopiaReloadPage');
			}).fail(function (jqXHR, textStatus, errorThrown) {
				var response = JSON.parse(jqXHR.responseText);
				flashAjaxStatus('danger', 'Could not toggle admin' + response.error.message);
			});
		};
	}

	$.fn.adminEditController = GetJQueryPlugin('adminEditController', adminEditController);

})(jQuery);

(function ($) {
	function adminLoginController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.endpoint = this.element.data('endpoint');

		this.start = function () {
			this.element.on('submit', function (e) {
				e.preventDefault();
				$.post(self.endpoint, {
						'email': self.element.find('[name="email"]').val(),
						'password': self.element.find('[name="password"]').val()
					})
					.done(function () {
						loadPage('/admin?login');
						didLogIn();
					})
					.fail(function () {
						flashAjaxStatus('error', 'login failed');
					});
			});
		};

		this.stop = function () {
			this.element.off('submit');
		};
	}
	$.fn.adminLoginController = GetJQueryPlugin('adminLoginController', adminLoginController);
})(jQuery);

(function ($) {
	function adminLogoutController(elem, options) {
		this.element = $(elem);
		var self = this;
		this.endpoint = this.element.data('endpoint');
		this.start = function () {
			this.element.on('click', function (e) {
				e.preventDefault();
				$.post(self.endpoint)
					.done(function () {
						loadPage('/admin?logout');
						didLogOut();
					})
					.fail(function () {
						alert("error");
						didLogOut();
					});
			});
		};

		this.stop = function () {
			this.element.off('click');
		};
	}
	$.fn.adminLogoutController = GetJQueryPlugin('adminLogoutController', adminLogoutController);
})(jQuery);
