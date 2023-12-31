import grapesjs from 'grapesjs';
import { jsPanel } from 'jspanel4/es6module/jspanel.js';

global.VjEditor = null;
global.VjLayerpanel = null;
global.VJLandingPage = { components: '', html: '', style: '', css: '' };
global.VJIsSaveCall = false;
global.VJLocalBlocksMarkup = '';
global.GrapesjsInit;
global.CurrentExtTabUrl = '';
global.IsVJEditorSaveCall = true;
global.IsVJCBRendered = false;

$(window).load(function () {
	if ($(window).width() < 1260 || typeof vjEditorSettings == 'undefined') {
		$(".ToolbarItem li:not(.PageSettings),.toolmanager,.more_icons,.blockItem.blocksmenu ").hide(0);
		$(".block-manager > div").not("#MenuSettings,.Menupanel-top").hide(0);
		$(".Searchresult ul").empty();
		$(".block-manager").find("#MenuSettings").show();
		$(".Menupanel-top").show();
		$(".Menupanel-top input").focus();
	}
});

$(document).ready(function () {

	var Responsive = VjLocalized.Responsive.replace(/ /g, '_').toLowerCase();
	var Filters = VjLocalized.Filters.replace(/ /g, '_').toLowerCase();
	var Transform = VjLocalized.Transform.replace(/ /g, '_').toLowerCase();
	var Size = VjLocalized.Size.replace(/ /g, '_').toLowerCase();
	var Border = VjLocalized.Border.replace(/ /g, '_').toLowerCase();
	var Text = VjLocalized.Text.replace(/ /g, '').toLowerCase();
	var Extra = VjLocalized.Extra.replace(/ /g, '').toLowerCase();
	var Display = VjLocalized.Display.replace(/ /g, '').toLowerCase();

	if (window.parent.CurrentTabUrl.indexOf('?') > 0)
		CurrentExtTabUrl = window.parent.CurrentTabUrl + '&mid=0&icp=true';
	else
		CurrentExtTabUrl = window.parent.CurrentTabUrl + '?mid=0&icp=true';

	if (typeof TemplateLibraryURL != 'undefined' && TemplateLibraryURL != '') {

		window.addEventListener('message', event => {

			if (TemplateLibraryURL.startsWith(event.origin)) {

				if (typeof event.data != 'undefined') {

					if (typeof event.data.action != 'undefined') {

						if (event.data.action == 'preview-open')
							$('#UXpagerender').addClass('preview-open')
						else
							$('#UXpagerender').removeClass('preview-open');
					}
					else {
						var templatePath = '';
						var templateHash = '';
						var LibraryUrl = TemplateLibraryURL.split('/templates/')[0];
						if (event.origin.startsWith(LibraryUrl) && event.data != undefined) {
							if (typeof event.data.path != 'undefined') {
								if (!event.origin.startsWith(LibraryUrl)) {
									templatePath = LibraryUrl + event.data.path;
									templateHash = event.data.hash;
								}
								else {
									templatePath = event.data.path;
									templateHash = event.data.hash;
								}
							}
						}
						if (!$('.optimizing-overlay').length)
							$('.vj-wrapper').prepend('<div class="optimizing-overlay"><h1><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />Please wait</h1></div>');
						var sf = $.ServicesFramework(-1);
						$.ajax({
							type: "Post",
							url: window.location.origin + $.ServicesFramework(-1).getServiceRoot("Vanjaro") + "Block/ImportCustomBlock?TemplateHash=" + templateHash + "&TemplatePath=" + templatePath,
							headers: {
								'ModuleId': parseInt(sf.getModuleId()),
								'TabId': parseInt(sf.getTabId()),
								'RequestVerificationToken': sf.getAntiForgeryValue()
							},
							success: function (data) {
								$('.vj-wrapper').find('.optimizing-overlay').remove();
								if (data.Html != undefined && data.Html.length > 0) {
									var LibraryBlock = VjEditor.BlockManager.add('LibraryBlock', {
										content: data.Html,
										label: '<img src="' + data.ScreenshotPath + '"/><div class="sub-label">Drag & Drop Me</div>',
										attributes: {
											class: 'floating',
											id: 'LibraryBlock'
										}
									});

									var block = VjEditor.BlockManager.render(LibraryBlock, { external: true });
									$(window.document.body).append(block).find('[data-bs-dismiss="modal"]').trigger('click', [false]);
								}
							}
						});
					}
				}
			}
			else if (ExtensionStoreURL.startsWith(event.origin)) {
				if (typeof event.data != 'undefined') {
					if (typeof event.data.action != 'undefined' && event.data.action == 'DownloadPackage') {
						var sf = $.ServicesFramework(-1);
						var PackageData = {
							Packages: JSON.stringify(event.data.data)
						};
						$.ajax({
							type: "POST",
							url: window.location.origin + $.ServicesFramework(-1).getServiceRoot("Extensions") + "InstallPackage/Download",
							data: PackageData,
							headers: {
								'ModuleId': parseInt(sf.getModuleId()),
								'TabId': parseInt(sf.getTabId()),
								'RequestVerificationToken': sf.getAntiForgeryValue()
							},
							success: function (data) {
								$(window.parent.document.body).find('[data-bs-dismiss="modal"]').click();
								parent.OpenPopUp(null, 600, 'center', 'Install', ExtensionURL, 800);
							}
						});
					}
				}
			}
		});
	}

	//Tooltip
	$('[data-bs-toggle="tooltip"]').tooltip();

	$(".pubish-btn").click(function (e) {
		e.preventDefault();

		VjEditor.select();

		var VjPublishChanges = function () {
			if (VJIsContentApproval == 'True') {
				swal(
					{
						title: VjLocalized.PublishAreyousure, text: VjLocalized.PublishCommentlable + ' <span class="SweetAlertBold">' + VJNextStateName + '</span> <textarea class="form-control" id="VJReviewComment" rows="4" style="width: 100%;margin-top: 20px;" type="text" tabindex="3" placeholder="Comments"></textarea>', html: true, confirmButtonText: VjLocalized.Submit, cancelButtonText: VjLocalized.Cancel, showCancelButton: true, closeOnConfirm: false, animation: "slide-from-top", inputPlaceholder: VjLocalized.EnterComment
					},
					function (inputValue) {
						if ($('#VJReviewComment', parent.document).val() != '') {
							editor.StorageManager.getStorages().remote.attributes.params.Comment = $('#VJReviewComment', parent.document).val();
							RunSaveCommand();
							$('#VJBtnPublish').addClass('disabled');
							$('.gjs-cv-canvas__frames').addClass('lockcanvas');
							swal.close();
							$.each(getAllComponents(), function (Index, component) {
								if (component.attributes.attributes["data-block-type"] == "global" && $(component.getEl()).find('.global-tools').length == 0)
									window.parent.StyleGlobal(component);
							});
							setTimeout(function () { RenderMarkup('Register Link'); }, 300);

						}
						else {
							swal.showInputError(VjLocalized.Commentisrequired);
							return false;
						}
					});
			}
			else {
				RunSaveCommand();
				$.each(getAllComponents(), function (Index, component) {
					if (component.attributes.attributes["data-block-type"] == "global" && $(component.getEl()).find('.global-tools').length == 0)
						window.parent.StyleGlobal(component);
				});
			}
			$(VjEditor.Canvas.getBody()).find('[data-gjs-type="globalblockwrapper"]').css('pointer-events', '');
		};

		var waitForEl = function (selector, size, callback) {
			//Added math.round to fix OptimizeImages issue on small screens
			if (jQuery(selector).length && Math.round(jQuery(selector).width()) == size) {
				callback();
			} else {
				setTimeout(function () {
					waitForEl(selector, size, callback);
				}, 10);
			}
		};
		var calcSizes = '';
		var resolutionSizes = [1920, 1600, 1366, 1200, 768, 320];
		var OptimizeImages = function (optImages, sizes) {

			if (!$('.optimizing-overlay').length)
				$('.vj-wrapper').prepend('<div class="optimizing-overlay"><h1><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />Optimizing Images</h1></div>');

			if (typeof optImages != 'undefined' && optImages.length > 0) {

				var image = optImages[0];

				if (typeof sizes != 'undefined' && sizes.length > 0 && image) {

					var size = sizes.shift();

					$('.gjs-frame').width(size).css('transition', 'none');

					waitForEl('.gjs-frame', size, function () {

						//Calc Sizes
						var imgEl = image.getEl();

						if (imgEl) {

							if ($(imgEl).parents('[data-gjs-type="link"]').length)
								$(imgEl).parents('[data-gjs-type="link"]').css('width', '100%');

							var imgWidth;
							imgWidth = $(imgEl).parents('.picture-box').width();

							if (imgWidth && imgWidth > 0) {
								var calcWidth = Math.round((imgWidth / size) * 100);
								calcSizes += '(min-width:' + size + 'px) ' + calcWidth + 'vw,';
							}
						}

						OptimizeImages(optImages, sizes);
					});
				}
				else {
					IsVJEditorSaveCall = false;
					//Set Sizes
					//Trim last character of calcSizes to remove trailing comma
					image.parent().components().models[0].addAttributes({ 'sizes': calcSizes.slice(0, -1) });
					image.parent().components().models[1].addAttributes({ 'sizes': calcSizes.slice(0, -1) });

					calcSizes = '';

					optImages.shift();
					OptimizeImages(optImages, resolutionSizes.slice());
				}
			}
			else {

				$('.gjs-frame').removeAttr('style');

				setTimeout(function () {
					$('.vj-wrapper').find('.optimizing-overlay').remove();
					VjPublishChanges();
				}, 500);
			}
		};
		var optImages = jQuery.grep(getAllComponents(), function (n, i) {
			return (n.attributes.optimize) && (n.parent().attributes.type == 'picture-box') && (typeof n.parent().components().models[0] != 'undefined') && (typeof n.parent().components().models[1] != 'undefined');
		});

		if (optImages != undefined && optImages.length > 0) {

			if (!$('.optimizing-overlay').length)
				$('.vj-wrapper').prepend('<div class="optimizing-overlay"><h1><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />Optimizing Images</h1></div>');

			if ($('.gjs-frame').contents().find("html").hasClass('responsive'))
				$(".device-manager .device-view#Desktop").trigger("click");

			waitForEl('.gjs-frame-wrapper', VjEditor.Canvas.getCanvasView().$el.innerWidth(), function () {
				OptimizeImages(optImages, resolutionSizes.slice());
			});

		}
		else
			VjPublishChanges();

		VjEditor.UndoManager.stop();
		VjEditor.UndoManager.clear();
		setTimeout(function () {
			$(window.parent.document.body).find('#VJReviewComment').focus();
		}, 100);

		if (vjEditorSettings.PublishLink != null && vjEditorSettings.PublishLink != '')
			OpenPopUp(null, 900, 'right', VjLocalized.Setting, vjEditorSettings.PublishLink);
	});

	var VJAutoSaveTimeOutid;

	setTimeout(function () {
		if ($("#mode-switcher").length > 0) {
			if ($("#mode-switcher").offset().left <= 0) {
				$('.sidebar').addClass('settingclosebtn');
			}
			else {
				$('.sidebar').removeClass('settingclosebtn');
			}
		}
	}, 500);

	if (typeof VJIsPageDraft !== 'undefined' && VJIsPageDraft != undefined && VJIsPageDraft == "True") {
		$('#VJBtnPublish').removeClass('disabled');
	}

	global.debounce = function (func, wait, immediate) {
		var timeout;
		return function () {
			var context = this, args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	global.GrapesjsInit = function () {

		if (isEditPage() && typeof vjEditorSettings != 'undefined') {

			if (vjEditorSettings.PublishText != null && vjEditorSettings.PublishText != '')
				$('#VJBtnPublish').text(vjEditorSettings.PublishText);

			if (!vjEditorSettings.EditPage) {

				var applinkmarkup = '';
				var tempMarkup = '';

				if (vjEditorSettings.AppName && vjEditorSettings.AppTitle) {

					if (vjEditorSettings.AppLink != undefined) {

						if (vjEditorSettings.AppLink.onClick != undefined)
							applinkmarkup = "<div class=\"app-name\"><a href=\"javascript:void(0);\" onClick=\"" + vjEditorSettings.AppLink.onClick + "\"><span class=\"app-link\">" + vjEditorSettings.AppName + "</span></a></div>";

						if (vjEditorSettings.AppLink.OpenInNewWindow)
							applinkmarkup = "<div class=\"app-name\"><a href=\"" + vjEditorSettings.AppLink.OpenInNewWindow + "\"><span \"app-link\">" + vjEditorSettings.AppName + "</span></a></div>";

						tempMarkup = applinkmarkup;
					}
					else
						tempMarkup = '<div class="app-name">' + vjEditorSettings.AppName + '</div>';

					var markup = '<div class="app-header"><div class="app-title"><strong>Editing</strong>: ' + vjEditorSettings.AppTitle + '</div>' + tempMarkup + '</div>';
					$('.vj-wrapper').prepend(markup);
				}
			}

			$('#vjEditor').scroll(function () {
				debounce(VjEditor.refresh(), 100);
			});

			if (GetParameterByName('m2v', parent.window.location) != null && GetParameterByName('m2v', parent.window.location).startsWith('true')) {
				$(window.parent.document.body).find('#dnn_ContentPane').prepend('<div class="optimizing-overlay"><h1><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />Please Wait</h1></div>');
			}

			if ($('#dnn_ContentPane').length > 0)
				$('#dnn_ContentPane').addClass("sidebar-open");

			$(window.parent.document.body).find('.vj-wrapper').removeClass("m2vDisplayNone");
			if ($.isFunction($.ServicesFramework) || $.isFunction(window.parent.$.ServicesFramework)) {
				var sf;
				try {
					sf = $.ServicesFramework(-1);
				}
				catch (sferr) { sf = window.parent.$.ServicesFramework(-1); }
				if (parseInt(sf.getTabId()) <= 0)
					sf = window.parent.$.ServicesFramework(-1);
				if ($('.initpageloader').length <= 0) {
					$('.vj-wrapper').prepend('<div class="initoptimizing-overlay"></div>');
					$('body').append('<div class="initpageloader"><div class="modal-backdrop fade show"></div><img class="revisionloader initrevisionloaderimg" src="' + window.parent.VjDefaultPath + 'loading.svg" /></div>');
				}
				$.ajax({
					type: "GET",
					url: vjEditorSettings.GetContentUrl,
					cache: false,
					headers: {
						'ModuleId': parseInt(vjEditorSettings.ModuleId),
						'TabId': parseInt(sf.getTabId()),
						'RequestVerificationToken': sf.getAntiForgeryValue()
					},
					success: function (response) {
						if (response != undefined) {
							VJLandingPage.components = response.ContentJSON;
							VJLandingPage.html = response.Content;
							VJLandingPage.style = response.StyleJSON;
							VJLandingPage.css = response.Style;
						}
						if (VJLandingPage != undefined) {
							$("#mode-switcher").find("em").addClass("fa-chevron-left").removeClass("fa-chevron-right");
							$('.sidebar, #dnn_ContentPane').addClass("sidebar-open").removeClass("sidebar-close");
							BindLinksAndScripts();
							VjLayerpanel = jsPanel.create({
								id: 'layer-manager',
								theme: 'dark',
								headerTitle: VjLocalized.Navigator,
								position: 'right-top -320 20',
								resizeit: false,
								contentSize: {
									width: '300',
								},
								headerControls: {
									minimize: 'remove',
									normalize: 'remove',
									maximize: 'remove',
									smallify: 'remove',
									reset: 'remove',
									add: {
										html: '<span class="panelclosebtn"><em class="fas fa-times"></em></span>',
										name: 'Closebtn',
										handler: function (panel, control) {
											$(".jsPanel-btn-Closebtn").click(function () {
												$('#layer-manager').hide();
											});
										},
									}
								},

								onclosed: function () {
									VjLayerpanel = null;
								},
								callback: function () {
									this.content.style.padding = '0';
								},
							});

							var vjcomps = eval(VJLandingPage.components);
							var plugins = [];

							BuildAppComponent(vjcomps);
							BuildAppComponentFromHtml(vjcomps, VJLandingPage.html);
							BuildBlockComponent(vjcomps);
							vjcomps = FilterComponents(vjcomps);

							plugins.push('vjpreset');

							if (vjEditorSettings.Blocks && typeof LoadBlocks != 'undefined') {
								LoadBlocks(grapesjs);
								plugins.push('customblocks');
							}
							else {

								plugins.push('modulewrapper', 'blockwrapper', 'vjblocks', 'customcode');

								if (typeof LoadThemeBlocks != 'undefined') {
									LoadThemeBlocks(grapesjs);
									plugins.push('ThemeBlocks');
								}
							}

							if (typeof LoadCustomCode != 'undefined')
								LoadCustomCode(grapesjs);

							VjEditor = grapesjs.init({
								protectedCss: '',
								allowScripts: 1,
								panels: {
									defaults: []
								},
								canvas: {
									styles: VjLinks, scripts: VjScriptTags
								},
								modal: {
									backdrop: 0
								},
								components: vjcomps || VJLandingPage.html,
								style: eval(VJLandingPage.style) || VJLandingPage.css,
								showOffsets: 1,
								avoidInlineStyle: 1,
								noticeOnUnload: 0,
								container: '#vjEditor',
								height: '100%',
								fromElement: vjcomps != undefined ? false : true,
								plugins: plugins,
								pluginsOpts: {
									'vj-preset': {
										colorPicker: 'default',
										grapickOpts: {
											min: 1,
											max: 99,
										}
									}
								},
								selectorManager: {
									appendTo: '.selectorManager',
								},
								styleManager: {
									clearProperties: true,
									appendTo: '.styleManager',
									sectors: [{
										name: VjLocalized.Margin,
										open: false,
										properties: [
											{
												type: 'customrange',
												name: 'Margin Left',
												property: 'margin-left',
												units: [
													{ name: 'px', min: -50, max: 200, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: -100, max: 100, step: 1 },
													{ name: 'vh', min: -100, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Margin Right',
												property: 'margin-right',
												units: [
													{ name: 'px', min: -50, max: 200, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: -100, max: 100, step: 1 },
													{ name: 'vh', min: -100, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Margin Top',
												property: 'margin-top',
												units: [
													{ name: 'px', min: -50, max: 200, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: -100, max: 100, step: 1 },
													{ name: 'vh', min: -100, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Margin Bottom',
												property: 'margin-bottom',
												units: [
													{ name: 'px', min: -50, max: 200, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: -100, max: 100, step: 1 },
													{ name: 'vh', min: -100, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											}
										]
									}, {
										name: VjLocalized.Padding,
										open: false,
										properties: [
											{
												type: 'customrange',
												name: 'Padding Left',
												property: 'padding-left',
												units: [
													{ name: 'px', min: 0, max: 200, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Padding Right',
												property: 'padding-right',
												units: [
													{ name: 'px', min: 0, max: 200, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Padding Top',
												property: 'padding-top',
												units: [
													{ name: 'px', min: 0, max: 200, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Padding Bottom',
												property: 'padding-bottom',
												units: [
													{ name: 'px', min: 0, max: 200, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											}
										]
									}, {
										name: VjLocalized.Size,
										open: false,
										properties: [
											{
												type: 'customrange',
												name: 'Width',
												property: 'width',
												units: [
													{ name: 'px', min: 0, max: 1920, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Min Width',
												property: 'min-width',
												units: [
													{ name: 'px', min: 0, max: 1920, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Max Width',
												property: 'max-width',
												units: [
													{ name: 'px', min: 0, max: 1920, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Height',
												property: 'height',
												units: [
													{ name: 'px', min: 0, max: 1080, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Min Height',
												property: 'min-height',
												units: [
													{ name: 'px', min: 0, max: 1080, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Max Height',
												property: 'max-height',
												units: [
													{ name: 'px', min: 0, max: 1080, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
													{ name: 'rem', min: 0.5, max: 10, step: 0.1 },
													{ name: 'em', min: 0.5, max: 10, step: 0.1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}
										]
									}, {
										name: VjLocalized.Responsive,
										open: false,
										properties: [
											{
												type: 'customradio',
												name: 'Hide in Mobile Portrait',
												property: 'd-mobile-none',
												defaults: 'd-mobile-show',
												list: [{
													name: 'Yes',
													value: 'd-mobile-none'
												},
												{
													name: 'No',
													value: 'd-mobile-show'
												}],
											}, {
												type: 'customradio',
												name: 'Hide in Mobile Landscape',
												property: 'd-mobile-landscape-none',
												defaults: 'd-mobile-landscape-show',
												list: [{
													name: 'Yes',
													value: 'd-mobile-landscape-none'
												},
												{
													name: 'No',
													value: 'd-mobile-landscape-show'
												}],
											}, {
												type: 'customradio',
												name: 'Hide in Tablet',
												property: 'd-tablet-none',
												defaults: 'd-tablet-show',
												list: [{
													name: 'Yes',
													value: 'd-tablet-none'
												},
												{
													name: 'No',
													value: 'd-tablet-show'

												}],
											}, {
												type: 'customradio',
												name: 'Hide in Desktop',
												property: 'd-desktop-none',
												defaults: 'd-desktop-show',
												list: [{
													name: 'Yes',
													value: 'd-desktop-none'
												},
												{
													name: 'No',
													value: 'd-desktop-show'
												}],
											}]
									}, {
										name: VjLocalized.Border,
										open: false,
										properties: [
											{
												type: 'customradio',
												name: 'Border Postion',
												property: 'border-position',
												defaults: 'sm-border',
												list: [{
													name: 'Border',
													img: 'border.svg',
													value: 'sm-border',
												}, {
													name: 'Border Top',
													img: 'border-top.svg',
													value: 'sm-border-top',
												}, {
													name: 'Border Left',
													img: 'border-left.svg',
													value: 'sm-border-left',
												}, {
													name: 'Border Bottom',
													img: 'border-bottom.svg',
													value: 'sm-border-bottom',
												}, {
													name: 'Border Right',
													img: 'border-right.svg',
													value: 'sm-border-right',
												}],
											},
											{
												type: 'customradio',
												name: 'Border Style',
												property: 'border-style',
												defaults: 'none',
												list: [{
													value: 'solid',
													name: 'Solid',
													img: 'border-solid.png'
												}, {
													value: 'double',
													name: 'Double',
													img: 'border-double.png'
												}, {
													value: 'dotted',
													name: 'Dotted',
													img: 'border-dotted.png'
												}, {
													value: 'dashed',
													name: 'Dashed',
													img: 'border-dashed.png'
												}],
												UpdateStyles: true,
											},
											{
												type: 'color',
												name: 'Color',
												property: 'border-color',
												cssproperty: 'border-color',
												defaults: 'rgb(52, 58, 64)',
											},
											{
												type: 'customrange',
												name: 'Width',
												property: 'border-width',
												units: [
													{ name: 'px', min: 0, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customradio',
												name: 'Border Style',
												property: 'border-top-style',
												defaults: 'none',
												list: [{
													value: 'solid',
													name: 'Solid',
													img: 'border-solid.png'
												}, {
													value: 'double',
													name: 'Double',
													img: 'border-double.png'
												}, {
													value: 'dotted',
													name: 'Dotted',
													img: 'border-dotted.png'
												}, {
													value: 'dashed',
													name: 'Dashed',
													img: 'border-dashed.png'
												}],
												UpdateStyles: true,
											},
											{
												type: 'color',
												name: 'Color',
												property: 'border-top-color',
												cssproperty: 'border-color',
												defaults: 'rgb(52, 58, 64)',
											},
											{
												type: 'customrange',
												name: 'Width',
												property: 'border-top-width',
												units: [
													{ name: 'px', min: 0, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customradio',
												name: 'Border Style',
												property: 'border-right-style',
												defaults: 'none',
												list: [{
													value: 'solid',
													name: 'Solid',
													img: 'border-solid.png'
												}, {
													value: 'double',
													name: 'Double',
													img: 'border-double.png'
												}, {
													value: 'dotted',
													name: 'Dotted',
													img: 'border-dotted.png'
												}, {
													value: 'dashed',
													name: 'Dashed',
													img: 'border-dashed.png'
												}],
												UpdateStyles: true,
											},
											{
												type: 'color',
												name: 'Color',
												property: 'border-right-color',
												cssproperty: 'border-color',
												defaults: 'rgb(52, 58, 64)',
											},
											{
												type: 'customrange',
												name: 'Width',
												property: 'border-right-width',
												units: [
													{ name: 'px', min: 0, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customradio',
												name: 'Border Style',
												property: 'border-bottom-style',
												defaults: 'none',
												list: [{
													value: 'solid',
													name: 'Solid',
													img: 'border-solid.png'
												}, {
													value: 'double',
													name: 'Double',
													img: 'border-double.png'
												}, {
													value: 'dotted',
													name: 'Dotted',
													img: 'border-dotted.png'
												}, {
													value: 'dashed',
													name: 'Dashed',
													img: 'border-dashed.png'
												}],
												UpdateStyles: true,
											},
											{
												type: 'color',
												name: 'Color',
												property: 'border-bottom-color',
												cssproperty: 'border-color',
												defaults: 'rgb(52, 58, 64)',
											},
											{
												type: 'customrange',
												name: 'Width',
												property: 'border-bottom-width',
												units: [
													{ name: 'px', min: 0, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customradio',
												name: 'Border Style',
												property: 'border-left-style',
												defaults: 'none',
												list: [{
													value: 'solid',
													name: 'Solid',
													img: 'border-solid.png'
												}, {
													value: 'double',
													name: 'Double',
													img: 'border-double.png'
												}, {
													value: 'dotted',
													name: 'Dotted',
													img: 'border-dotted.png'
												}, {
													value: 'dashed',
													name: 'Dashed',
													img: 'border-dashed.png'
												}],
												UpdateStyles: true,
											},
											{
												type: 'color',
												name: 'Color',
												property: 'border-left-color',
												cssproperty: 'border-color',
												defaults: 'rgb(52, 58, 64)',
											},
											{
												type: 'customrange',
												name: 'Width',
												property: 'border-left-width',
												units: [
													{ name: 'px', min: 0, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 0,
											}
										]
									}, {
										name: VjLocalized.BorderRadius,
										open: false,
										properties: [
											{
												type: 'customrange',
												name: 'Top Left',
												property: 'border-top-left-radius',
												units: [
													{ name: 'px', min: 0, max: 50, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Top Right',
												property: 'border-top-right-radius',
												units: [
													{ name: 'px', min: 0, max: 50, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Bottom Left',
												property: 'border-bottom-left-radius',
												units: [
													{ name: 'px', min: 0, max: 50, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 0,
											},
											{
												type: 'customrange',
												name: 'Bottom Right',
												property: 'border-bottom-right-radius',
												units: [
													{ name: 'px', min: 0, max: 50, step: 1 },
													{ name: '%', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 0,
											}
										]
									}, {
										name: VjLocalized.BackgroundShadow,
										open: false,
										buildProps: ['background-color', 'background', 'box-shadow'],
									}, {
										name: VjLocalized.Position,
										open: false,
										buildProps: ['z-index', 'position', 'top', 'left', 'bottom', 'right'],
										properties: [
											{
												type: 'customrange',
												name: 'Z Index',
												property: 'z-index',
												step: 1,
												min: -10,
												max: 999,
												defaults: 0,
											}, {
												type: 'customrange',
												name: 'Top',
												property: 'top',
												units: [
													{ name: 'px', min: -200, max: 400, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Left',
												property: 'left',
												units: [
													{ name: 'px', min: -200, max: 400, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Bottom',
												property: 'bottom',
												units: [
													{ name: 'px', min: -200, max: 400, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}, {
												type: 'customrange',
												name: 'Right',
												property: 'right',
												units: [
													{ name: 'px', min: -200, max: 400, step: 1 },
													{ name: '%', min: -100, max: 100, step: 1 },
													{ name: 'vw', min: 0, max: 100, step: 1 },
													{ name: 'vh', min: 0, max: 100, step: 1 },
												],
												unit: 'px',
												defaults: 'auto',
											}
										]
									}, {
										name: VjLocalized.Display,
										open: false,
										properties: [{
											type: 'radio',
											name: 'Display',
											property: 'display',
											defaults: 'none',
											options: [{
												value: 'none',
												name: 'none',
											}, {
												value: 'block',
												name: 'block',
											}, {
												value: 'inline',
												name: 'inline',
											}, {
												value: 'inline-block',
												name: 'inline-block',
											}, {
												value: 'flex',
												name: 'flex',
											}],
										}, {
											name: 'Container',
											property: 'container',
											type: 'composite',
											properties: [{
												name: 'Direction',
												property: 'flex-direction',
												type: 'customradio',
												cssproperty: 'flex-direction',
												UpdateStyles: true,
												list: [{
													value: 'row',
													name: 'Row',
													img: 'flex-dir-row.png',
												}, {
													value: 'row-reverse',
													name: 'Row Reverse',
													img: 'flex-dir-row-rev.png',
												}, {
													value: 'column',
													name: 'Column',
													img: 'flex-dir-col.png',
												}, {
													value: 'column-reverse',
													name: 'Column Reverse',
													img: 'flex-dir-col-rev.png',
												}],
											}, {
												name: 'Justify',
												property: 'justify-content',
												type: 'customradio',
												UpdateStyles: true,
												list: [{
													value: 'flex-start',
													name: 'Start',
													img: 'align-left.png'
												}, {
													value: 'space-between',
													name: 'Space Between',
													img: 'align-between.png',
												}, {
													value: 'space-around',
													name: 'Space Around',
													img: 'align-around.png',
												}, {
													value: 'center',
													name: 'Center',
													img: 'align-center.png',
												}, {
													value: 'flex-end',
													name: 'End',
													img: 'align-right.png',
												}],
											}, {
												name: 'Align',
												property: 'align-items',
												type: 'customradio',
												UpdateStyles: true,
												list: [{
													value: 'flex-start',
													name: 'Start',
													img: 'align-left.png',
												}, {
													value: 'stretch',
													name: 'Stretch',
													img: 'align-justify.png',
												}, {
													value: 'center',
													name: 'Center',
													img: 'align-center.png',
												}, {
													value: 'flex-end',
													name: 'End',
													img: 'align-right.png',
												}],
											}, {
												name: 'Order',
												property: 'order',
												type: 'customrange',
												defaults: 0,
												step: 1,
												min: 0,
												max: 100,
												cssproperty: 'order',
											}],
										},
										{
											name: 'Items',
											property: 'flex',
											type: 'composite',
											properties: [{
												name: 'Grow',
												property: 'flex-grow',
												type: 'customrange',
												defaults: 0,
												step: 1,
												min: 0,
												max: 100,
											}, {
												name: 'Shrink',
												property: 'flex-shrink',
												type: 'customrange',
												defaults: 0,
												step: 1,
												min: 0,
												max: 100,
												cssproperty: 'flex-shrink',
											}, {
												name: 'Basis',
												property: 'flex-basis',
												type: 'customrange',
												units: [{ name: 'px', min: 1, max: 100, step: 1 },
												{ name: '%', min: 1, max: 100, step: 1 }
												],
												unit: 'px',
												defaults: 'auto',
												cssproperty: 'flex-basis',
											},
											{
												name: 'Align',
												property: 'align-self',
												type: 'customradio',
												UpdateStyles: true,
												list: [{
													value: 'auto',
													name: 'Auto',
												}, {
													value: 'flex-start',
													name: 'Start',
													img: 'align-left.png',
												}, {
													value: 'center',
													name: 'Center',
													img: 'align-center.png',
												}, {
													value: 'stretch',
													name: 'Stretch',
													img: 'align-justify.png'
												}, {
													value: 'flex-end',
													name: 'End',
													img: 'align-right.png'
												}],
											}],
										}]
									}, {
										name: VjLocalized.Transform,
										open: false,
										properties: [
											{
												type: 'custom_slider',
												name: 'Transform Rotate X',
												property: 'rotateX',
												cssproperty: 'transform',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0
											},
											{
												type: 'custom_slider',
												name: 'Transform Rotate Y',
												property: 'rotateY',
												cssproperty: 'transform',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0
											},
											{
												type: 'custom_slider',
												name: 'Transform Rotate Z',
												property: 'rotateZ',
												cssproperty: 'transform',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0
											},
											{
												type: 'custom_slider',
												name: 'Transform Scale X',
												property: 'scaleX',
												cssproperty: 'transform',
												step: 0.1,
												min: 0,
												max: 10,
												defaults: 1
											},
											{
												type: 'custom_slider',
												name: 'Transform Scale Y',
												property: 'scaleY',
												cssproperty: 'transform',
												step: 0.1,
												min: 0,
												max: 10,
												defaults: 1
											},
											{
												type: 'custom_slider',
												name: 'Transform Scale Z',
												property: 'scaleZ',
												cssproperty: 'transform',
												step: 0.1,
												min: 0,
												max: 10,
												defaults: 1
											},
											{
												type: 'custom_slider',
												name: 'Transform Skew X',
												property: 'skewX',
												cssproperty: 'transform',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0
											},
											{
												type: 'custom_slider',
												name: 'Transform Skew Y',
												property: 'skewY',
												cssproperty: 'transform',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0
											}
										]
									}, {
										name: VjLocalized.Transitions,
										open: false,
										buildProps: ['transition'],
									}, {
										name: VjLocalized.Filters,
										open: false,
										properties: [
											{
												type: 'custom_slider',
												name: 'Blur',
												property: 'blur',
												cssproperty: 'filter',
												step: .1,
												min: 0,
												max: 10,
												unit: 'px',
												units: ['px'],
												defaults: 0
											},
											{
												type: 'custom_slider',
												name: 'Brightness',
												property: 'brightness',
												cssproperty: 'filter',
												step: 10,
												min: 0,
												max: 200,
												unit: '%',
												units: ['%'],
												defaults: 100,
											},
											{
												type: 'custom_slider',
												name: 'Contrast',
												property: 'contrast',
												cssproperty: 'filter',
												step: 10,
												min: 0,
												max: 200,
												unit: '%',
												units: ['%'],
												defaults: 100,
											},
											{
												type: 'custom_slider',
												name: 'Grayscale',
												property: 'grayscale',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 100,
												unit: '%',
												units: ['%'],
												defaults: 0,
											},
											{
												type: 'custom_slider',
												name: 'Hue-rotate',
												property: 'hue-rotate',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 360,
												unit: 'deg',
												units: ['deg'],
												defaults: 0,
											},
											{
												type: 'custom_slider',
												name: 'Invert',
												property: 'invert',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 100,
												unit: '%',
												units: ['%'],
												defaults: 0,
											},
											{
												type: 'custom_slider',
												name: 'Opacity',
												property: 'opacity',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 100,
												unit: '%',
												units: ['%'],
												defaults: 100
											},
											{
												type: 'custom_slider',
												name: 'Saturate',
												property: 'saturate',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 100,
												unit: '%',
												units: ['%'],
												defaults: 100,
											},
											{
												type: 'custom_slider',
												name: 'Sepia',
												property: 'sepia',
												cssproperty: 'filter',
												step: 1,
												min: 0,
												max: 100,
												unit: '%',
												units: ['%'],
												defaults: 0,
											}
										]
									}, {
										name: VjLocalized.Extra,
										open: false,
										buildProps: ['cursor', 'float', 'clear', 'overflow-x', 'overflow-y'],
										properties: [
											{
												type: 'radio',
												name: 'Clear',
												property: 'clear',
												defaults: 'none',
												options: [{
													value: 'none',
													name: 'none',
												}, {
													value: 'both',
													name: 'both',
												}],
											}, {
												type: 'radio',
												name: 'Overflow Horizontal',
												property: 'overflow-x',
												defaults: 'visible',
												options: [{
													value: 'visible',
													name: 'visible',
												}, {
													value: 'hidden',
													name: 'hidden',
												}, {
													value: 'scroll',
													name: 'scroll',
												}, {
													value: 'auto',
													name: 'auto',
												}],
											}, {
												type: 'radio',
												name: 'Overflow Vertical',
												property: 'overflow-y',
												defaults: 'visible',
												options: [{
													value: 'visible',
													name: 'visible',
												}, {
													value: 'hidden',
													name: 'hidden',
												}, {
													value: 'scroll',
													name: 'scroll',
												}, {
													value: 'auto',
													name: 'auto',
												}],
											}
										]
									}
									]
								},
								layerManager: {
									appendTo: '#layer-manager .jsPanel-content'
								},
								colorPicker: {
									appendTo: 'parent',
									offset: {
										top: 26, left: -180,
									},
									showInput: true,
									preferredFormat: "hex",
								},
								traitManager: {
									appendTo: '.traitsManager'
								},
								deviceManager: {
									devices: [{
										name: 'Desktop',
										width: '', // default size
									}, {
										name: 'Tablet',
										width: '768px', // this value will be used on canvas width
										widthMedia: '1199px', // this value will be used in CSS @media
									}, {
										name: 'Mobile Landscape',
										width: '700px', // this value will be used on canvas width
										widthMedia: '767px', // this value will be used in CSS @media
									}, {
										name: 'Mobile Portrait',
										width: '360px', // this value will be used on canvas width
										widthMedia: '575px', // this value will be used in CSS @media
									}]
								},
								storageManager: {
									type: 'remote',
									autosave: false,
									autoload: false,
									stepsBeforeSave: 1,
									urlStore: vjEditorSettings.UpdateContentUrl,
									onComplete(jqXHR, status) {
										if (jqXHR.IsSuccess) {
											if (typeof jqXHR.ShowNotification != 'undefined' && jqXHR.ShowNotification)
												ShowNotification('', VjLocalized.PagePublished, 'success');
										}
										else if (jqXHR.Message != undefined && jqXHR.Message != '')
											ShowNotification('', jqXHR.Message, 'error');

										if (jqXHR.SaveContentNotification != undefined && jqXHR.SaveContentNotification != '') {
											eval(jqXHR.SaveContentNotification);
										}
									},
									params: {
										EntityID: vjEditorSettings.EntityID,
										IsPublished: false,
										m2v: false,
										Comment: ""
									},
									headers: {
										'ModuleId': parseInt(vjEditorSettings.ModuleId),
										'TabId': parseInt(sf.getTabId()),
										'RequestVerificationToken': sf.getAntiForgeryValue()
									}
								}
							});

							var fontfamilylist = [];
							$.each(VJFonts, function (k, v) {
								fontfamilylist.push({ value: v.Value, name: v.Name });
							});

							//setCustomRte();
							const rte = VjEditor.RichTextEditor;
							rte.remove('link');

							const isValidAnchor = rte => {
								const anchor = rte.selection().anchorNode;
								const parentNode = anchor && anchor.parentNode;
								return (
									(parentNode && parentNode.nodeName == 'A')
								);
							};

							VjEditor.RichTextEditor.add('link', {
								icon: '<i class="fa fa-link"/>',
								attributes: { title: 'Link' },
								state: (rte, doc) => {
									isValidAnchor(rte) ? $(rte.actions[4].btn).addClass('gjs-rte-active') : $(rte.actions[4].btn).addClass('gjs-rte-inactive');
									return isValidAnchor(rte);
								},
								result: function (rte) {
									if (isValidAnchor(rte)) {
										var rtetext = `${rte.selection()}`;
										rte.selection().anchorNode.parentNode.remove();
										rte.insertHTML(rtetext);
										VjEditor.getSelected().view.disableEditing();
										//rte.exec('unlink');
									}
									else {
										rte.insertHTML(`<a class="link" href="">${rte.selection()}</a>`);
										var rtetext = `${rte.selection()}`;
										var selected = VjEditor.getSelected();
										selected.view.syncContent();
										VjEditor.getSelected().view.disableEditing();
										$.each(selected.components().models, function (k, v) {
											if ($(v.getEl())[0].innerText == rtetext) {
												VjEditor.select(v);
												return;
											}
										});
										$('.href_url').focus();
									}
								},
							});

							const isValidSpan = rte => {
								const anchor = rte.selection().anchorNode;
								const parentNode = anchor && anchor.parentNode;
								return (
									(parentNode && parentNode.classList.contains('text-inner'))
								);
							};

							VjEditor.RichTextEditor.add('span', {
								icon: '<i class="fas fa-paint-brush"/>',
								attributes: { title: 'Custom Styling' },
								state: (rte, doc) => {
									isValidSpan(rte) ? $(rte.actions[5].btn).addClass('gjs-rte-active') : $(rte.actions[5].btn).addClass('gjs-rte-inactive');
									return isValidSpan(rte);
								},
								result: function (rte) {
									var e = rte.selection().anchorNode;
									if (e.parentNode.tagName.toLowerCase() == "span" && (e.parentNode.classList && e.parentNode.classList.contains('text-inner'))) {
										rte.selection().anchorNode.parentElement.outerHTML = rte.selection().anchorNode.parentElement.innerHTML;
										VjEditor.getSelected().view.disableEditing();
									}
									else {
										rte.insertHTML(`<span class="text-inner">${rte.selection()}</span>`);
										var rtetext = `${rte.selection()}`;
										var selected = VjEditor.getSelected();

										if (selected.attributes.type == 'list-item')
											selected = selected.findType('list-text')[0];

										selected.view.syncContent();
										selected.view.disableEditing();
										$.each(selected.components().models, function (k, v) {
											if (v.attributes.content == rtetext) {
												VjEditor.select(v);
												return;
											}
										});
									}
								}
							});

							// Fixed editor is not defined with absolute mode
							window.editor = VjEditor;

							VjEditor.on('load', function () {
								try { $.ServicesFramework(-1); }
								catch (err) { window.parent.location.reload(); }
								setTimeout(function () { $(window.parent.document.body).find('.vj-wrapper').find('.initoptimizing-overlay').remove(); $(window.parent.document.body).find('.initpageloader').remove(); }, 500);
								$('#BlockManager').find('.block-search').val('');

								if (vjEditorSettings.EditPage) {
									LoadApps();
									LoadDesignBlocks();
								}

								if ($(window).width() < 1260) {
									$(window.parent.document.body).find('.gjs-cv-canvas__frames').addClass('deviceframe');
								}

								$(window).resize(function () {
									if ($(window).width() < 1260) {
										$(window.parent.document.body).find('.gjs-cv-canvas__frames').addClass('deviceframe');
										$(".ToolbarItem li:not(.PageSettings),.toolmanager,.more_icons, .blockItem.blocksmenu ").hide();
										$("a.blockItem.settings").trigger("click");
									}
									else if ($(window.parent.document.body).find('.gjs-cv-canvas__frames').hasClass('deviceframe')) {
										$(window.parent.document.body).find('.gjs-cv-canvas__frames').removeClass('deviceframe');
										$(".ToolbarItem li,.toolmanager,.more_icons,.blockItem.blocksmenu ").show();
										$('.ToolbarItem > li:gt(4)').hide();
										$('.ntoolbox > li:lt(5)').hide();
										$("a.blockItem.blocksmenu").trigger("click");
									}
								});

								$('#gjs-clm-add-tag').attr('title', 'Add Class').tooltip();

								$.each(getAllComponents(), function (ci, cd) {
									if (cd.attributes.forcesave != undefined && cd.attributes.forcesave == 'true') {
										delete cd.attributes.forcesave;
										VjEditor.runCommand("save");
									}
								});

								if (vjEditorSettings.EditPage)
									LoadCustomBlocks();
								else
									ChangeBlockType();

								VjEditor.UndoManager.start();

								if (VJIsPageDraft == "False")
									$('#VJBtnPublish').addClass('disabled');

								if ((VJIsContentApproval == "True" && VJIsLocked == "True") && VJIsPageDraft == "False") {
									$('.gjs-cv-canvas__frames').addClass('lockcanvas');
									$('#VJBtnPublish').addClass('disabled');
								}
								else
									$('.gjs-cv-canvas__frames').removeClass('lockcanvas');

								if (GetParameterByName('m2v', parent.window.location) != null && GetParameterByName('m2v', parent.window.location).startsWith('true') && VJLandingPage.components == '' && VJLandingPage.html != '') {
									VjEditor.runCommand("save");
									parent.window.location.reload();
									//VjEditor.destroy();
									//// Remove All Managers
									//$('#ContentBlocks, .styleManager, .traitsManager').empty();
									//VjLayerpanel.close();
									//VjInit();
								} else if (GetParameterByName('m2v', parent.window.location) != null && GetParameterByName('m2v', parent.window.location).startsWith('true')) {
									setTimeout(function () { $($(window.parent.document.body).find('#dnn_ContentPane')[0]).find('.optimizing-overlay').remove(); }, 1000);
								}

								if (vjEditorSettings.EditPage && typeof getCookie("vj_UXLoad") != 'undefined' && getCookie("vj_UXLoad") != null && getCookie("vj_UXLoad") != '') {


									if (getCookie("vj_UX_BlockRevision_Id") != 'undefined' && getCookie("vj_UX_BlockRevision_Id") != null && getCookie("vj_UX_BlockRevision_Id") != '') {

										VjEditor.select(editor.getWrapper().find('#' + getCookie('vj_UX_BlockRevision_Id')));
										eraseCookie("vj_UX_BlockRevision_Id");
									}

									$("#BlockManager").hide();
									$("#StyleToolManager").hide();
									$('#iframeHolder').find('iframe').attr('src', getCookie('vj_UXLoad'));
									$("#iframeHolder").fadeIn();

									eraseCookie("vj_UXLoad");
								}

								VjEditor.SelectorManager.getAll().filter(selector => {
									if (selector.attributes.type == 1) {
										selector.set({
											active: false
										})
									}
								});
								CleanCssrules();
							});

							var parentClone = "";
							var parentRemove = "";
							var sortermarup = '';

							//Sorting TabModules
							VjEditor.on('component:drag:start', function (model) {

								$('.tlb-app-setting-panel').hide();

								if (typeof model != 'undefined' && typeof model.parent != 'undefined') {

									if ((model.parent.attributes.type == "column" || model.parent.attributes.type == "link") && model.parent.components().length == 1)
										$(model.parent.getEl()).attr("data-empty", "true");

									var blockwrapper = model.target.closest('[data-gjs-type="blockwrapper"]');

									if (blockwrapper) {
										parentRemove = blockwrapper;
										parentClone = blockwrapper.clone();
									}
									else if (model.target.getName != 'undefined') {
										if (model.target.attributes.type == "row" || model.target.attributes.type == "button" || model.target.attributes.type == "icon" || model.target.attributes.type == "list" || model.target.attributes.type == "list-text") {
											parentRemove = model.parent;
											parentClone = model.parent.clone();
										}
										else if (model.target.attributes.type == "image") {
											parentRemove = model.target.closestType('image-box');
											parentClone = model.target.closestType('image-box').clone();
										}
									}
								}

								if (model.target != undefined && model.target.attributes != undefined && model.target.attributes.attributes != undefined && model.target.attributes.attributes.dmid != undefined)
									sortermarup = model.target.getEl().children[0].innerHTML;

								VjEditor.runCommand('core:component-outline');
							});

							VjEditor.on('component:drag:end', function (model, bmodel) {

								if (typeof model != 'undefined' && typeof model.target != 'undefined') {

									if (typeof model.target.attributes != 'undefined' && model.target.attributes.type == "videobox") {
										model.target.components().models.find(t => t.attributes.type == 'video').set({ 'src': model.target.attributes.src });
										$(model.target.getEl()).find('iframe').attr('src', model.target.attributes.src);
									}
									else if (typeof model.parent != 'undefined' && model.parent && (model.parent.attributes.type == "column" || model.parent.attributes.type == "link"))
										$(model.parent.getEl()).removeAttr("data-empty");

									if (parentRemove != '' && parentClone != '') {
										var selectModel = parentClone.components().models[0];
										model.target.replaceWith(parentClone);
										setTimeout(function () {
											VjEditor.select(selectModel);
											parentRemove.remove();
											parentRemove = '';
											parentClone = '';
										});
									}

									if (typeof model.target.attributes != 'undefined' && model.target.attributes.type == "carousel-item") {

										$(model.parent.getEl()).find('.active.carousel-item').removeClass('active')

										$(model.parent.find('.carousel-item')).each(function (index, item) {
											item.removeClass('active');
										});

										model.parent.find('.carousel-item')[0].addClass('active');

										$(model.parent.parent().getEl()).find('.active.carousel-indicator').removeClass('active');
										$(model.parent.parent().getEl()).find('.carousel-indicator').first().addClass('active');

									}
								}

								if (sortermarup != undefined && sortermarup != '' && model.parent != undefined && model.parent.getEl().children != undefined) {
									$.each(model.parent.getEl().children, function (k, v) {
										if ($(v).hasClass('gjs-comp-selected')) {
											$.each(v.children, function (key, val) {
												if ($(val).attr('vjmod') != undefined)
													val.innerHTML = sortermarup;
											})
										}
									});
								}

								sortermarup = '';

								if (!$('.View.Layout').hasClass('active'))
									VjEditor.stopCommand('core:component-outline');
							});

							VjEditor.Keymaps.add('ns:redo', 'ctrl+y', editor => { console.log('redo call'); VjEditor.UndoManager.redo(); });
							//VjEditor.Keymaps.add('ns:undo', 'ctrl+z', editor => { console.log('undo call'); VjEditor.UndoManager.undo(); });

							//Adding TabModules
							VjEditor.on('block:drag:stop', function (model, bmodel) {

								if (typeof model != "undefined") {

									if ($(model.getEl()).parents('[data-gjs-type="globalblockwrapper"]').length && model.attributes.type == 'globalblockwrapper') {
										model.remove();
										return false;
									}

									var modelClasses = model.attributes.classes;
									if (modelClasses.length) {
										modelClasses.map(selector => {
											if (selector.attributes.active) {
												selector.set({
													active: false
												});
											}
										});
									}

									$.each(getAllComponents(model), function (i, n) {
										var classes = n.attributes.classes;
										if (classes.length) {
											classes.map(selector => {
												if (selector.attributes.active) {
													selector.set({
														active: false
													});
												}
											});
										}
									});

									if (typeof model.attributes != "undefined") {

										var Block = model.attributes.type;

										if (Block == 'grid' || Block == 'image-box' || Block == 'modulewrapper')
											VjEditor.select(model);
									}

									if (typeof model.components != 'undefined' && typeof model.components().models[0] != 'undefined') {

										var childBlock = model.components().models[0].attributes.type;

										if (childBlock == 'icon' || childBlock == 'image')
											VjEditor.select(model.components().models[0]);
									}

								}

								if (typeof VjEditor.BlockManager.get('LibraryBlock') != 'undefined') {
									if (bmodel != undefined && bmodel.attributes != undefined && bmodel.attributes.attributes != undefined && bmodel.attributes.attributes.id == 'LibraryBlock') {
										IsVJCBRendered = true;
										if (!$('.optimizing-overlay').length)
											$('.vj-wrapper').prepend('<div class="optimizing-overlay"><h1><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />Please wait</h1></div>');
									}
									VjEditor.BlockManager.remove('LibraryBlock');
								}

								if (!$('.borderlines').hasClass('active'))
									VjEditor.stopCommand('core:component-outline');

								if (model != undefined && model.attributes != undefined && model.attributes.attributes != undefined && model.attributes.attributes.mid != undefined) {
									model.view.$el[0].innerHTML = '<img class="centerloader" src="' + VjDefaultPath + 'loading.svg" />';
									var ModuleData = {
										UniqueID: model.attributes.attributes.uid != undefined ? parseInt(model.attributes.attributes.uid) : 0,
										DesktopModuleId: parseInt(model.attributes.attributes.dmid)
									};
									var sf = $.ServicesFramework(-1);
									$.ajax({
										type: "POST",
										url: window.location.origin + $.ServicesFramework(-1).getServiceRoot("Vanjaro") + "Page/AddModule",
										data: ModuleData,
										headers: {
											'ModuleId': parseInt(sf.getModuleId()),
											'TabId': parseInt(sf.getTabId()),
											'RequestVerificationToken': sf.getAntiForgeryValue()
										},
										success: function (response) {
											VjEditor.StorageManager.setAutosave(false);
											model.attributes.attributes.mid = response;
											var framesrc = CurrentTabUrl;
											if (framesrc.indexOf("?") == -1)
												framesrc = framesrc + "?mid=" + response + "&icp=true";
											else
												framesrc = framesrc + "&mid=" + response + "&icp=true";
											model.view.$el[0].innerHTML = '<div data-gjs-type="module" draggable="true" vjmod="true"><div id="dnn_vj_' + response + '"><img class="centerloader" src="' + VjDefaultPath + 'loading.svg" /><iframe scrolling="no" onload="window.parent.RenderApp(this);" src="' + framesrc + '" style="width:100%;height:auto;"></iframe></div></div>';
											bmodel.attributes.content = '<div dmid="' + parseInt(model.attributes.attributes.dmid) + '" mid="' + response + '" fname="' + model.attributes.attributes.fname + '"><div vjmod="true"><app id="' + response + '"></app></div></div>';
											model.attributes.components.models[0].attributes.content = '<app id="' + response + '"></app>';
											model.attributes.name = VjLocalized.PrefixAppName + bmodel.id;
											VjEditor.LayerManager.render();

											setTimeout(function () {
												VjEditor.runCommand("save");
											}, 500);
										}
									});
								}
								else if (bmodel != undefined && bmodel.attributes != undefined && bmodel.attributes.attributes != undefined && bmodel.attributes.attributes.type == 'VjCustomBlock')
									RenderCustomBlock(model, bmodel);
								else if (model != undefined && model.attributes != undefined && model.attributes.attributes != undefined && model.attributes.attributes["data-block-type"] != undefined)
									RenderBlock(model, bmodel);
							});

							var ReverseColums = function (model) {

								var flexDirection = model.getStyle()['flex-direction'];
								var row = model.components().models[0];

								var className = 'col-xl-12';
								var Device = VjEditor.getDevice();

								if (Device == 'Mobile Portrait')
									className = 'col-12';
								else if (Device == 'Mobile Landscape')
									className = 'col-sm-12';
								else if (Device == 'Tablet')
									className = 'col-md-12';

								if (typeof flexDirection == 'undefined') {

									flexDirection = 'row';

									var style = model.getStyle();
									style['flex-direction'] = 'row';
									model.setStyle(style);
								}

								jQuery.each(row.components().models, function (i, column) {
									if (column.getEl().classList.contains(className)) {

										if (flexDirection.indexOf('reverse') >= 0)
											flexDirection = 'column-reverse';
										else
											flexDirection = 'column';

										return false;
									}
								});

								row.setStyle({ 'flex-direction': flexDirection });
							}

							VjEditor.on('component:selected', (model, argument) => {

								$('.ssmanager .component-name').text(model.getName());
								$('.ssmanager .component-id').text('#' + model.getId());

								if (typeof model.attributes.type == 'undefined')
									return false;
								else if (model.attributes.type == 'carousel-caption') {
									$.each(getAllComponents(model.parent()), function (i, n) {
										if (n.attributes.type == 'carousel-image') {
											VjEditor.select(n);
											return false;
										}
									});
									return;
								}
								else if (model.attributes.type == 'prev') {
									var slider = model.closest('[data-gjs-type="carousel"]');
									VjEditor.select(slider);
									VjEditor.runCommand("slider-prev", { slider });
									return;
								}
								else if (model.attributes.type == 'next') {
									var slider = model.closest('[data-gjs-type="carousel"]');
									VjEditor.select(slider);
									VjEditor.runCommand("slider-next", { slider });
									return;
								}
								else if (model.attributes.type == 'indicator') {
									var slider = model.closest('[data-gjs-type="carousel"]');
									VjEditor.select(slider);
									var index = parseInt(model.getAttributes()['data-bs-slide-to']);
									$('.gjs-frame').contents().find('#' + slider.getId()).carousel(index);
									return;
								}
								else if (model.attributes.type == 'column') {
									$(model.parent().getEl()).addClass('gjs-dashed');
									var dataPane = model.getTrait('data-pane');
									var migrate = GetParameterByName('migrate', parent.window.location.href);
									if ((migrate == null || (migrate != null && migrate.indexOf('true') == -1)) && typeof dataPane != 'undefined') {
										setTimeout(function () {
											$(dataPane.view.$el).hide(0);
										});
									}
								}
								else if (model.attributes.type == 'icon' || model.attributes.type == 'image') {

									if (typeof model.closestType('link') != 'undefined')
										setTimeout(function () {
											$(model.getTrait("href").el).parents(".gjs-trt-trait__wrp").hide();
										});
									else
										setTimeout(function () {
											$(model.getTrait("href").el).parents(".gjs-trt-trait__wrp").show();
										});
								}


								VjEditor.SelectorManager.setState();

								if (typeof model.attributes.toolbar[0] != 'undefined' && typeof model.attributes.toolbar[0].attributes != 'undefined' && typeof model.attributes.toolbar[0].attributes['title'] == 'undefined') {

									$.each(model.attributes.toolbar, function (k, v) {

										if (v.attributes['class'] == 'fa fa-arrow-up')
											v.attributes['title'] = VjLocalized.SelectParent;
										else if (v.command == 'vj-move' || v.command == 'tlb-move')
											v.attributes['title'] = VjLocalized.Move;
										else if (v.command == 'vj-copy' || v.command == 'tlb-clone')
											v.attributes['title'] = VjLocalized.Copy;
										else if (v.command == 'vj-delete' || v.command == 'tlb-delete')
											v.attributes['title'] = VjLocalized.Delete;
									});
								}

								var tb = model.get('toolbar');

								if (model.getStyle()["background-image"] != undefined && model.getStyle()["background-image"].indexOf('url') != -1 && !$(tb.find(element => element.attributes.class == 'fa fa-pencil')).length) {

									tb.splice(0, 0, { attributes: { class: 'fa fa-pencil', title: VjLocalized.EditImage }, command: 'custom-tui-image-editor' });

									VjEditor.getSelected().set('toolbar', tb);
								}
								else if (model.getStyle()["background-image"] == undefined && !model.attributes.editor && tb.length > 0) {

									$(tb).each(function (index, item) {

										if (item.attributes && item.attributes.class == "fa fa-pencil")
											tb.splice(index, 1);
									});

									VjEditor.getSelected().set('toolbar', tb);
								}

								$('.gjs-field-color-picker').on('show.spectrum', function () {

									var stylemanager = this.closest('.stylemanager');

									$(stylemanager).click(function (event) {
										event.stopPropagation();
									});
								});

								var sm = VjEditor.StyleManager;

								setTimeout(function () {

									var target = model;

									if (model.attributes.type == "icon")
										target = model.components().models[0];

									if (sm.getSector(Display)) {

										if (sm.getProperty(Display, 'display').attributes.value == 'flex') {
											$(sm.getProperty(Display, 'container').view.el).show();
											$(sm.getProperty(Display, 'flex').view.el).show();
										}
										else {
											$(sm.getProperty(Display, 'container').view.el).hide();
											$(sm.getProperty(Display, 'flex').view.el).hide();
										}
									}

									if (sm.getSector(Size)) {

										//Width
										var width = target.getStyle()['width'];

										if (typeof width == "undefined") {

											$(sm.getProperty(Size, 'width').view.$el.find('input[type="text"]')).val('auto');
											$(sm.getProperty(Size, 'width').view.$el.find('input[type="range"]')).val(parseInt($(target.getEl()).css('width')));
										}
										else
											$(sm.getProperty(Size, 'width').view.$el.find('input')).val(parseInt(width));

										if ($(sm.getProperty(Size, 'width').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'width').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'width').view.$el).find('.gjs-sm-clear').hide();

										//Height
										var height = target.getStyle()['height'];

										if (typeof height == "undefined") {

											$(sm.getProperty(Size, 'height').view.$el.find('input[type="text"]')).val('auto');
											$(sm.getProperty(Size, 'height').view.$el.find('input[type="range"]')).val(parseInt($(target.getEl()).css('height')));
										}
										else
											$(sm.getProperty(Size, 'height').view.$el.find('input')).val(parseInt(height));


										if ($(sm.getProperty(Size, 'height').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'height').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'height').view.$el).find('.gjs-sm-clear').hide();

										//Min Width
										var minWidth = target.getStyle()['min-width'];

										if (typeof minWidth == "undefined")
											$(sm.getProperty(Size, 'min-width').view.$el.find('input')).val('auto');
										else
											$(sm.getProperty(Size, 'min-width').view.$el.find('input')).val(parseInt(minWidth));

										if ($(sm.getProperty(Size, 'min-width').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'min-width').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'min-width').view.$el).find('.gjs-sm-clear').hide();

										//Max Width
										var maxWidth = target.getStyle()['max-width'];

										if (typeof maxWidth == "undefined")
											$(sm.getProperty(Size, 'max-width').view.$el.find('input')).val('auto');
										else
											$(sm.getProperty(Size, 'max-width').view.$el.find('input')).val(parseInt(maxWidth));

										if ($(sm.getProperty(Size, 'max-width').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'max-width').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'max-width').view.$el).find('.gjs-sm-clear').hide();

										//Min Height
										var minHeight = target.getStyle()['min-height'];

										if (typeof minHeight == "undefined")
											$(sm.getProperty(Size, 'min-height').view.$el.find('input')).val('auto');
										else
											$(sm.getProperty(Size, 'min-height').view.$el.find('input')).val(parseInt(minHeight));

										if ($(sm.getProperty(Size, 'min-height').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'min-height').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'min-height').view.$el).find('.gjs-sm-clear').hide();

										//Max Height
										var maxHeight = target.getStyle()['max-height'];

										if (typeof maxHeight == "undefined")
											$(sm.getProperty(Size, 'max-height').view.$el.find('input')).val('auto');
										else
											$(sm.getProperty(Size, 'max-height').view.$el.find('input')).val(parseInt(maxHeight));

										if ($(sm.getProperty(Size, 'max-height').view.$el.find('input[type="text"]')).val() != "auto")
											$(sm.getProperty(Size, 'max-height').view.$el).find('.gjs-sm-clear').show();
										else
											$(sm.getProperty(Size, 'max-height').view.$el).find('.gjs-sm-clear').hide();
									}
								});

								//Responsive
								if (sm.getSector(Responsive)) {
									sm.getProperty(Responsive, 'd-desktop-none').setValue("");
									sm.getProperty(Responsive, 'd-tablet-none').setValue("");
									sm.getProperty(Responsive, 'd-mobile-landscape-none').setValue("");
									sm.getProperty(Responsive, 'd-mobile-none').setValue("");
								}

								//Filters
								if (sm.getSector(Filters)) {

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('blur') != -1)
										sm.getProperty(Filters, 'blur').view.setValue('true');
									else
										sm.getProperty(Filters, 'blur').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('brightness') != -1)
										sm.getProperty(Filters, 'brightness').view.setValue('true');
									else
										sm.getProperty(Filters, 'brightness').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('contrast') != -1)
										sm.getProperty(Filters, 'contrast').view.setValue('true');
									else
										sm.getProperty(Filters, 'contrast').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('grayscale') != -1)
										sm.getProperty(Filters, 'grayscale').view.setValue('true');
									else
										sm.getProperty(Filters, 'grayscale').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('hue-rotate') != -1)
										sm.getProperty(Filters, 'hue-rotate').view.setValue('true');
									else
										sm.getProperty(Filters, 'hue-rotate').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('invert') != -1)
										sm.getProperty(Filters, 'invert').view.setValue('true');
									else
										sm.getProperty(Filters, 'invert').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('opacity') != -1)
										sm.getProperty(Filters, 'opacity').view.setValue('true');
									else
										sm.getProperty(Filters, 'opacity').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('saturate') != -1)
										sm.getProperty(Filters, 'saturate').view.setValue('true');
									else
										sm.getProperty(Filters, 'saturate').view.setValue('false');

									if (typeof model.getStyle()['filter'] != "undefined" && model.getStyle()['filter'].indexOf('sepia') != -1)
										sm.getProperty(Filters, 'sepia').view.setValue('true');
									else
										sm.getProperty(Filters, 'sepia').view.setValue('false');
								}

								//Transform

								if (sm.getSector(Filters)) {

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('rotateX') != -1)
										sm.getProperty(Transform, 'rotateX').view.setValue('true');
									else
										sm.getProperty(Transform, 'rotateX').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('rotateY') != -1)
										sm.getProperty(Transform, 'rotateY').view.setValue('true');
									else
										sm.getProperty(Transform, 'rotateY').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('rotateZ') != -1)
										sm.getProperty(Transform, 'rotateZ').view.setValue('true');
									else
										sm.getProperty(Transform, 'rotateZ').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('scaleX') != -1)
										sm.getProperty(Transform, 'scaleX').view.setValue('true');
									else
										sm.getProperty(Transform, 'scaleX').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('scaleY') != -1)
										sm.getProperty(Transform, 'scaleY').view.setValue('true');
									else
										sm.getProperty(Transform, 'scaleY').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('scaleZ') != -1)
										sm.getProperty(Transform, 'scaleZ').view.setValue('true');
									else
										sm.getProperty(Transform, 'scaleZ').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('skewX') != -1)
										sm.getProperty(Transform, 'skewX').view.setValue('true');
									else
										sm.getProperty(Transform, 'skewX').view.setValue('false');

									if (typeof model.getStyle()['transform'] != "undefined" && model.getStyle()['transform'].indexOf('skewY') != -1)
										sm.getProperty(Transform, 'skewY').view.setValue('true');
									else
										sm.getProperty(Transform, 'skewY').view.setValue('false');
								}


								$('.tlb-app-setting-panel').hide();

								if (model.attributes.traits.length <= 0) {
									$(".traitsmanager > .empty_msg").css({ "display": "block" });
									$(".traitsmanager > .gjs-two-color").css({ "display": "none" });
								}
								else {
									$(".traitsmanager > .empty_msg").css({ "display": "none" });
									$(".traitsmanager > .gjs-two-color").css({ "display": "block" });
								}

								if (model.attributes.type != 'wrapper')
									Stylemanager();
								else {
									$(".Menupanel-top").hide();
									$("#StyleToolManager").hide();
									$("#Notification").hide();
									$("#About").hide();
									$("#Shortcuts").hide();
									$('#DeviceManager,#LanguageManager,#MenuSettings,.ntoolbox').hide();
									$("#BlockManager").show();
									$(".panel-top").show();
									$("#ContentBlocks").show();
									$(".block-set").show();
									$("#iframeHolder").hide();
									setTimeout(function () {
										ChangeBlockType();
									}, 300);
								}

								if (sm.getSector(Border)) {
									FilterBorderOptions(model, 'sm-border');
									$(VjEditor.StyleManager.getProperty(Border, 'border-position').view.$el.find('input')[0]).prop('checked', true);
								}

								if (sm.getSector(Responsive)) {

									var flexProperty = VjEditor.StyleManager.getProperty(Responsive, 'flex-direction');

									if (model.attributes.type == 'grid') {

										if (flexProperty == null) {

											VjEditor.StyleManager.addProperty(Responsive, {
												type: 'customradio',
												name: 'Reverse Columns',
												property: 'flex-direction',
												defaults: 'row',
												list: [{
													value: 'row-reverse',
													name: 'Yes',
												}, {
													value: 'row',
													name: 'No',
												}],
												UpdateStyles: true,
											});

											flexProperty = VjEditor.StyleManager.getProperty(Responsive, 'flex-direction');
										}

										if (model.components().length) {
											$(model.components().models[0].getEl()).addClass('gjs-dashed');
										}
									}
									else {
										if (flexProperty != null)
											VjEditor.StyleManager.removeProperty(Responsive, 'flex-direction');
									}
								}

								if (typeof model.attributes.text != 'undefined' && model.attributes.text) {

									VjEditor.StyleManager.addSector(Text, {
										name: VjLocalized.Text,
										open: false,
										buildProps: ['color', 'font-family', 'font-size', 'line-height', 'letter-spacing', 'word-spacing', 'font-weight', 'font-style', 'text-transform', 'text-decoration', 'text-shadow'],
										properties: [{
											type: 'radio',
											name: 'Text decoration',
											property: 'text-decoration',
											defaults: 'none',
											options: [{
												value: 'none',
												name: 'None',
											}, {
												value: 'underline',
												name: 'Underline',
											}, {
												value: 'overline',
												name: 'Overline',
											}, {
												value: 'line-through',
												name: 'Strikethrough',
											}],
										}, {
											type: 'radio',
											name: 'Font style',
											property: 'font-style',
											defaults: 'normal',
											options: [{
												value: 'normal',
												name: 'Normal',
											}, {
												value: 'italic',
												name: 'Italic',
											}],
										}, {
											type: 'select',
											name: 'Font Family',
											property: 'font-family',
											list: fontfamilylist
										}, {
											type: 'customrange',
											name: 'Font size',
											property: 'font-size',
											units: [
												{ name: 'px', min: 1, max: 100, step: 1 },
												{ name: '%', min: 1, max: 100, step: 1 },
												{ name: 'em', min: 1, max: 100, step: 1 },
												{ name: 'rem', min: 1, max: 100, step: 1 },
												{ name: 'vw', min: 1, max: 100, step: 1 },
												{ name: 'vh', min: 1, max: 100, step: 1 },
											],
											unit: 'px',
											defaults: 16
										}, {
											type: 'customrange',
											name: 'Line height',
											property: 'line-height',
											units: [
												{ name: 'px', min: 1, max: 100, step: 1 },
												{ name: '%', min: 1, max: 100, step: 1 },
												{ name: 'em', min: 1, max: 6, step: 1 },
												{ name: 'rem', min: 1, max: 6, step: 1 },
												{ name: 'vw', min: 1, max: 100, step: 1 },
												{ name: 'vh', min: 1, max: 100, step: 1 },
											],
											unit: 'px',
											defaults: 24
										}, {
											type: 'customrange',
											name: 'Letter spacing',
											property: 'letter-spacing',
											units: [
												{ name: 'px', min: -5, max: 100, step: 1 },
												{ name: 'em', min: -1, max: 5, step: 1 },
												{ name: 'rem', min: -1, max: 5, step: 1 },
												{ name: 'vw', min: -5, max: 100, step: 1 },
												{ name: 'vh', min: -5, max: 100, step: 1 },
											],
											unit: 'px',
											defaults: 0
										}, {
											type: 'customrange',
											name: 'Word spacing',
											property: 'word-spacing',
											units: [
												{ name: 'px', min: -5, max: 100, step: 1 },
												{ name: 'em', min: -1, max: 5, step: 1 },
												{ name: 'rem', min: -1, max: 5, step: 1 },
												{ name: 'vw', min: -5, max: 100, step: 1 },
												{ name: 'vh', min: -5, max: 100, step: 1 },
											],
											unit: 'px',
											defaults: 0
										}, {
											type: 'radio',
											name: 'Font Weight',
											property: 'font-weight',
											options: [{
												value: '100',
												name: 'Thin',
											}, {
												value: '300',
												name: 'Light',
											}, {
												value: '400',
												name: 'Normal',
											}, {
												value: '500',
												name: 'Medium',
											}, {
												value: '700',
												name: 'Bold',
											}, {
												value: '900',
												name: 'Ultra Bold',
											}],
										}, {
											id: 'text-transform',
											type: 'radio',
											name: 'Text transform',
											property: 'text-transform',
											defaults: 'none',
											options: [{
												value: 'none',
												name: 'None',
											}, {
												value: 'uppercase',
												name: 'Uppercase',
											}, {
												value: 'lowercase',
												name: 'Lowercase',
											}, {
												value: 'capitalize',
												name: 'Capitalize',
											}],
										}],
									}, { at: 0 })
								}
								else if (VjEditor.StyleManager.getSector(Text))
									VjEditor.StyleManager.removeSector(Text);

								$('.gjs-sm-sector').on('click', function () {
									var $this = $(this);
									var sectorName = $this.attr('class').split(/\s+/)[1].replace("gjs-sm-sector__", "");
									if ($this.find('.gjs-sm-properties').is(':visible')) {
										$.each(VjEditor.StyleManager.getSectors().models, function (index, model) {
											model.set('open', false);
										});
										VjEditor.StyleManager.getSector(sectorName).set('open', true);
									}
								});

								$(VjEditor.StyleManager.getSectors().models).each(function (index, value) {
									$(value.attributes.properties.models).each(function (subIndex, subValue) {
										if (subValue.attributes.type == "slider")
											if ($(subValue.view.el).find('.gjs-field-integer input').val() == "auto" || $(subValue.view.el).find('.gjs-field-integer input').val() == "")
												$(subValue.view.el).find('input[type="range"]').val(0);
									});
								});
							});

							VjEditor.on('rte:enable', (model, argument) => {

								if (model.model.attributes.type == 'button-text') {
									const rte = editor.RichTextEditor;
									rte.actionbar.parentNode.hidden = true;
								}
								else {

									rte.actionbar.parentNode.hidden = false;

									if (model.model.closest('[data-gjs-type="link"]'))
										$(rte.actionbar).find('.fa.fa-link').parent().hide();

									else
										$(rte.actionbar).find('.fa.fa-link').parent().show();
								}

							});

							VjEditor.on('component:deselected', (model, argument) => {

								if (model.attributes.type == 'column')
									$(model.parent().getEl()).removeClass('gjs-dashed');

								if (model.attributes.type == 'grid' && model.components().length)
									$(model.components().models[0].getEl()).removeClass('gjs-dashed');
							});

							VjEditor.on('selector:add', selector => {
								if (selector.attributes.type == 1) {
									selector.set({
										active: false
									});
								}
							});

							VjEditor.on('component:styleUpdate', (model, property) => {

								if (property == "color" && typeof event != "undefined" && $(event.target).parents(".gjs-sm-property.gjs-sm-color").length) {
									if (model.attributes.type == "heading" || model.attributes.type == "text" || model.attributes.type == "button" || model.attributes.type == "list") {

										var classes = model.getClasses();
										classes = jQuery.grep(classes, function (className, index) {
											return (className.match(/\btext-\S+/g) || []).join(' ');
										});

										model.removeClass(classes);
									}
								}
								else if (property == "border-style" || property == "border-top-style" || property == "border-right-style" || property == "border-bottom-style" || property == "border-left-style") {

									if (model.getStyle()[property] != "none") {

										var borderWidth;

										switch (property) {
											case "border-top-style":
												borderWidth = "border-top-width"
												break;
											case "border-right-style":
												borderWidth = "border-right-width"
												break;
											case "border-bottom-style":
												borderWidth = "border-bottom-width"
												break;
											case "border-left-style":
												borderWidth = "border-left-width"
												break;
											default:
												borderWidth = "border-width"
										}

										if (typeof model.getStyle()[borderWidth] == "undefined")
											VjEditor.StyleManager.getProperty(Border, borderWidth).setValue(3);
									}
								}

								if (model.attributes.type == "icon" && (property == "width" || property == "min-width" || property == "max-width" || property == "height" || property == "min-height" || property == "max-height")) {

									var style = model.getStyle()[property];
									var svg = model.components().models[0];

									if (property == "width" || property == "height") {
										svg.addStyle({ 'width': style, 'height': style });
										model.addStyle({ 'line-height': style });
									}
									else if (property == "min-width")
										svg.addStyle({ 'min-width': style });
									else if (property == "max-width")
										svg.addStyle({ 'max-width': style });
									else if (property == "min-height")
										svg.addStyle({ 'min-height': style });
									else if (property == "max-height")
										svg.addStyle({ 'max-height': style });

									model.removeStyle(property);

								}
								else if (model.getAttributes()['data-block-type'] == "Logo" && (property == "width" || property == "height")) {
									const attr = model.getAttributes();
									delete attr['data-style'];
									model.setAttributes(attr);
									$(model.getEl()).find('img').removeAttr('style');
								}

								if (typeof event != "undefined" && event.target.className == "gjs-sm-clear")
									model.removeStyle(property);
							});

							VjEditor.on('component:styleUpdate:display', (model, argument) => {

								var sm = VjEditor.StyleManager;

								if (event.target.value == 'flex') {
									$(sm.getProperty(Display, 'container').view.el).show();
									$(sm.getProperty(Display, 'flex').view.el).show();
								}
								else {
									$(sm.getProperty(Display, 'container').view.el).hide();
									$(sm.getProperty(Display, 'flex').view.el).hide();
								}
							});

							VjEditor.on('component:styleUpdate:flex-direction', (model) => {

								if (model.attributes.type == "grid")
									ReverseColums(model);
							});

							VjEditor.on('component:styleUpdate:float', (model) => {

								if (model.attributes.type == "button" || model.attributes.type == "icon" || model.attributes.type == "list") {
									var style = model.parent().getStyle();
									style['float'] = model.getStyle()['float'];
									model.parent().setStyle(style);
								}
								else if (model.attributes.type == "image") {
									var style = model.parent().parent().getStyle();
									style['float'] = model.getStyle()['float'];
									model.parent().parent().setStyle(style);
								}
							});

							VjEditor.on('component:styleUpdate:border-style', (model, argument) => {

								var style = model.getStyle()['border-style'];

								model.addStyle({ 'border-top-style': style });
								model.addStyle({ 'border-bottom-style': style });
								model.addStyle({ 'border-left-style': style });
								model.addStyle({ 'border-right-style': style });

								model.removeStyle('border-style');

							});

							VjEditor.on('component:styleUpdate:border-color', (model, argument) => {

								var color = model.getStyle()['border-color'];

								model.addStyle({ 'border-top-color': color });
								model.addStyle({ 'border-bottom-color': color });
								model.addStyle({ 'border-left-color': color });
								model.addStyle({ 'border-right-color': color });

								model.removeStyle('border-color');

							});

							VjEditor.on('component:styleUpdate:border-width', (model, argument) => {

								var width = model.getStyle()['border-width'];

								model.addStyle({ 'border-top-width': width });
								model.addStyle({ 'border-bottom-width': width });
								model.addStyle({ 'border-left-width': width });
								model.addStyle({ 'border-right-width': width });

								model.removeStyle('border-width');

							});

							VjEditor.on('component:styleUpdate:background-image', (model, argument) => {

								var backgroundImage = model.getStyle()['background-image'];

								if (typeof backgroundImage != "undefined")
									model.set({ 'src': backgroundImage.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/'/g, '') });

							});

							VjEditor.Commands.add('core:copy', {
								run(editor, sender) {

									var filteredSelected = editor.getSelectedAll().filter(item => item.attributes.copyable == true);
									var copiedSelected = [];

									if (filteredSelected.length) {

										filteredSelected = filteredSelected.map(function (comp) {

											const type = comp.attributes.type;

											if (comp.parent() && comp.parent().attributes.type != 'wrapper' && (type == 'button' || type == 'icon' || type == 'list' || type == 'image')) {

												if (type == 'image')
													return comp.parent().parent();
												else
													return comp.parent();
											}
											else
												return comp;
										});

										filteredSelected.forEach(item => {
											copiedSelected.push(item.clone());
										});

										copiedSelected = copiedSelected.map(function (comp) {

											const type = comp.attributes.type;

											if (comp.findType('modulewrapper').length) {
												comp.findType('modulewrapper').forEach(item => {
													item.remove();
												});
											}

											return comp;
										});

										VjEditor.getModel().set('clipboard', copiedSelected);
									}
								}
							});

							VjEditor.on('component:paste', (model, argument) => {

								var type = model.attributes.type;

								if (type == 'button-box' || type == 'icon-box' || type == 'list-box' || type == 'image-box') {

									if (type == 'image-box')
										model.move(model.parent().parent().parent());
									else
										model.move(model.parent().parent());
								}
							});

							VjEditor.Commands.add('global-delete', {
								run(editor, sender) {
									setTimeout(function () {
										VjEditor.runCommand('core:component-delete');
									}, 100);
								}
							});

							VjEditor.Commands.add('custom-tui-image-editor', {
								run(editor, sender) {

									VjEditor.runCommand('tui-image-editor');
									var applyButton = $('.tui-image-editor__apply-btn');

									$('#tie-btn-crop').on('click', function () {
										if (applyButton.is(':visible'))
											applyButton.hide();
										else
											applyButton.show();
									});

									$('#tie-crop-button .tui-image-editor-button.apply, #tie-crop-button .tui-image-editor-button.cancel').on('click', function () {
										applyButton.show();
									});
								}
							});

							//Custom Block Settings
							VjEditor.Commands.add('tlb-vjblock-setting', {
								run(editor, sender) {
									var event = window;
									var guid = $(event.event.currentTarget).attr('guid');
									var url = CurrentExtTabUrl + "&guid=" + guid;
									var width = 500;
									var currentTargetWidth = $(event.event.currentTarget).attr('width');
									if (typeof currentTargetWidth != 'undefined' && currentTargetWidth != null && currentTargetWidth != 'undefined') {
										width = parseInt($(event.event.currentTarget).attr('width'));
									}
									OpenPopUp(null, width, 'right', '', url);
								}
							});

							//TabModules Settings
							VjEditor.Commands.add('tlb-app-setting', {
								run(editor, sender) {
									var event = window;
									var guid = $(event.event.currentTarget).attr('guid');
									var width = $(event.event.currentTarget).attr('width');
									var url = CurrentExtTabUrl + "&guid=" + guid + "#!/permissions/" + editor.getSelected().attributes.attributes.mid;
									OpenPopUp(null, width, 'right', VjLocalized.Setting, url);
								}
							});

							//TabModules Action Menu
							VjEditor.Commands.add('tlb-app-actions', {
								run(editor, sender, opts) {
									var event = window;
									this.editor = editor;
									var target = event.event.currentTarget || editor.getSelected();
									var canvas = editor.Canvas;
									var setting = this.settingsEl;
									if (target) {
										var panel = "tlb-app-setting-panel";
										setting = editor.$('<div class="' + panel + '"></div>')[0];
										canvas.getToolsEl().appendChild(setting);
										opts.BlockMenus.forEach(function (t) {
											var n = editor.$('<div class="' + panel + '__option">' + t.Title + "</div>")[0];
											n.addEventListener("click", function () {
												if (typeof t.Command != 'undefined') {
													VjEditor.runCommand(t.Command, {
														'bind': true
													});
												}
												else {
													if (t.NewWindow == 'True')
														window.open(t.Url, '_blank');
													else {
														var width = '100%';

														if (typeof t.Width != 'undefined')
															width = t.Width;

														var position = 'right';

														if (typeof t.Position != 'undefined')
															position = t.Position;

														if (t.Url.indexOf('javascript:') == -1)
															OpenPopUp(null, width, position, t.Title, t.Url, '', '', '', t.ModuleId, t.Scrollbars, t.TitlePosition);
														else
															eval(t.Url);
													}
												}
												this.parentElement.style.display = "none";
											});
											setting.appendChild(n);
										});
										this.settingsEl = setting;
										setting.style.display = 'block';
										var ToolbarEl = canvas.getToolbarEl()
											, ElementDim = canvas.getTargetToElementDim(setting, target)
											, ClientRect = setting.getBoundingClientRect()
											, TEClientRect = ToolbarEl.getBoundingClientRect()
											, position = {
												top: ElementDim.canvasTop,
												left: ElementDim.canvasLeft
											}
											, styletop = parseFloat(ToolbarEl.style.top)
											, ClientRectheight = styletop - ClientRect.height
											, left = parseFloat(ToolbarEl.style.left);
										ClientRectheight <= position.top && (ClientRectheight = styletop + TEClientRect.height),
											left <= position.left && (left = position.left),
											setting.offsetWidth > ToolbarEl.offsetWidth && (left = left - (setting.offsetWidth - ToolbarEl.offsetWidth)),
											setting.style.top = ClientRectheight + "px",
											setting.style.left = left + "px"
									}
								},
							});

							//Personalization
							VjEditor.Commands.add('tlb-app-personalization', {
								run(editor, sender) {
									var event = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
									var target = event.target || editor.getSelected();
									window.document.vj_personalization_target = target;
									var perm = target.attributes.attributes.perm;
									if (perm == undefined)
										perm = 0;
									var url = CurrentExtTabUrl + "&guid=b1b28eac-b520-4a20-8c36-f0283e8ca263#!/permissions/" + perm + "/" + target.attributes.type;
									OpenPopUp(null, 800, 'right', VjLocalized.Setting, url);
								}
							});

							//Image
							VjEditor.Commands.add('open-assets', {
								run(editor, sender) {
									var event = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
									var target = event.target;
									window.document.vj_image_target = target;
									var url = CurrentExtTabUrl + "&guid=a7a5e632-a73a-4792-8049-bc15a9435505";
									OpenPopUp(null, 900, 'right', VjLocalized.Image, url);
								}
							});

							VjEditor.Commands.add("export-component", {
								run: function (t, e) {
									var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}
										, r = {
											html: "",
											css: ""
										}

									const model = n.component || t.getSelected();
									r.html = model.toHTML();
									r.css = t.CodeManager.getCode(model, 'css', { cssc: t.CssComposer });

									return r;
								},
							});

							$(VjEditor.Canvas.getBody()).on("paste", '[contenteditable="true"]', function (e) {
								e.preventDefault();
								var text = e.originalEvent.clipboardData.getData('text');
								e.target.ownerDocument.execCommand("insertText", false, text);
							});

							VjEditor.on('block:drag:start', function (model) {

								VjEditor.runCommand('core:component-outline');

								if (typeof model != "undefined") {

									if (model.attributes.id == 'LibraryBlock')
										$('#LibraryBlock').css('opacity', '0.01');
								}
							});

							VjEditor.on('change:changesCount', e => {

								if (e != undefined && e.changed != undefined && e.changed.changesCount > 0 && VJIsLocked == 'False' && IsVJEditorSaveCall) {

									if (VJAutoSaveTimeOutid) {
										clearTimeout(VJAutoSaveTimeOutid);
									}

									if (e.changed.changesCount >= VjEditor.StorageManager.getStepsBeforeSave()) {
										VJAutoSaveTimeOutid = setTimeout(function () {
											if ($('.sidebar-open.settingclosebtn').length == 0 && !VJIsSaveCall) {
												VjEditor.runCommand("save");
											}
										}, 1000)
									}
								}
							});

							VjEditor.on('storage:start:store', function (Data) {
								if (Data != undefined && Data != '') {
									var globalblocks = [];
									$.each(getAllComponents(), function (k, v) {
										if (v.attributes.type == "globalblockwrapper" && $(v.getEl()).find('.fa-unlock').length <= 0) {
											try {
												if (v.attributes != undefined)
													v.attributes.content = '';
												var content = { html: '', css: '' };
												$.each(v.attributes.components.models, function (mi, mv) {
													var mvcontent = VjEditor.runCommand("export-component", {
														component: mv
													});
													if (mvcontent != undefined && mvcontent.html != undefined && mvcontent.html != "") {
														content.html += mvcontent.html;
														content.css += mvcontent.css;
													}
												});
												if (content != undefined && content.html != undefined && content.html != "" && $(content.html)[0].innerHTML != "") {
													var item = {
														ccid: v.attributes.attributes['id'],
														guid: v.attributes.attributes['data-guid'],
														html: content.html,
														css: content.css,
													};
													globalblocks.push(item);
													if (v.attributes != undefined && v.attributes.attributes != undefined && v.attributes.attributes.published != undefined) {
														v.attributes.attributes.published = true;
													}
												}
											}
											catch (err) { console.log(err); }
										}
									});
									Data.globalblocks = JSON.stringify(globalblocks);
									Data = VjCleanData(Data);
								}
							});

							VjEditor.on('storage:error', (err) => {
								swal({ title: "Error", html: true, text: `${err}`, type: "error", });
							});

							VjEditor.on('storage:start:store', function (Data) {
								VJIsSaveCall = true;
							});

							VjEditor.on('storage:end:store', function (Data) {

								VJIsSaveCall = false;

								if (Data != '' && Data.PageReviewSettings != undefined && Data.PageReviewSettings) {
									VJIsContentApproval = Data.PageReviewSettings.IsContentApproval ? "True" : "False";
									VJNextStateName = Data.PageReviewSettings.NextStateName;
									VJIsPageDraft = Data.PageReviewSettings.IsPageDraft ? "True" : "False";;
									VJIsLocked = Data.PageReviewSettings.IsLocked ? "True" : "False";;
									VJIsModeratorEditPermission = Data.PageReviewSettings.IsModeratorEditPermission;

									if (VJIsPageDraft == "True")
										$('#VJBtnPublish').removeClass('disabled');
									else
										$('#VJBtnPublish').addClass('disabled');

									if (VJIsPageDraft == "False" || VJIsLocked == "True")
										$('#VJBtnPublish').addClass('disabled');

									if (VJIsContentApproval == "True" && VJIsLocked == "True")
										$('.gjs-cv-canvas__frames').addClass('lockcanvas');
									else
										$('.gjs-cv-canvas__frames').removeClass('lockcanvas');

									if (Data.PageReviewSettings.IsContentApproval)
										eval(Data.ReviewToastMarkup);
									$("#VJnotifycount", parent.document).text(Data.NotifyCount);

								}

								if (Data != null && Data != '' && Data.RedirectAfterm2v != null && typeof Data.RedirectAfterm2v != "undefined")
									window.location.href = Data.RedirectAfterm2v;
								if (IsVJCBRendered)
									window.parent.location.reload();
							});

							var iframeBody = VjEditor.Canvas.getBody();
							$(iframeBody).on("keydown", "[contenteditable]", e => {
								// trap the return key being pressed
								if (e.keyCode === 13) {
									e.preventDefault();
									// insert 2 br tags (if only one br tag is inserted the cursor won't go to the next line)
									e.target.ownerDocument.execCommand("insertHTML", false, "<br>&nbsp;");
									e.target.ownerDocument.execCommand("delete", false, "&nbsp;");
									// prevent the default behaviour of return key pressed
									return false;
								}
							});

							VjEditor.on('component:add', function (model) {
								if (model.parent() != undefined && (model.parent().attributes.type == "column" || model.parent().attributes.type == "link"))
									$(model.parent().getEl()).removeAttr("data-empty");
							});

							VjEditor.on('component:remove', function (model) {

								if (typeof event != "undefined") {

									if (event.keyCode == 46) {

										if (model.attributes.type == 'carousel-image')
											VjEditor.runCommand('slide-delete', { target: model });

										if (model.attributes.type == 'button' || model.attributes.type == 'list' || model.attributes.type == 'icon' || model.attributes.type == 'image' || model.attributes.type == 'image-gallery-item')
											VjEditor.runCommand('vj-delete', { target: model });
									}

									var mouseEvent = false;
									var keyboardEvent = false;

									if (typeof event.target != "undefined" && typeof event.target.classList != "undefined" && event.target.classList.length > 0 && event.target.classList.contains('gjs-toolbar-item') && event.target.classList.contains('fa-trash-o'))
										mouseEvent = true;

									if (typeof event.key != "undefined" && event.key == "Delete")
										keyboardEvent = true;

									if (mouseEvent || keyboardEvent)
										ShowBlockUI();
								}

								if (model.parent() != undefined && (model.parent().attributes.type == "column" || model.parent().attributes.type == "link") && model.parent().components().length == 0)
									$(model.parent().getEl()).attr("data-empty", "true");

								if (model.parent() != undefined && model.parent().attributes.type == "row" && model.parent().components().length == 0) {
									if (model.parent().parent() != undefined && model.parent().parent().attributes.type == "grid")
										model.parent().parent().remove();
								}
							});

							$(VjEditor.Canvas.getDocument()).on("dblclick", "[data-gjs-type='wrapper']", function (e) {
								Stylemanager();
							});

							$('.jsPanel-content').on("mousedown", function () {
								Stylemanager();
							});
						}
						$(window.parent.document.body).find('.pageloader').remove();
					}
				});
			}
		}
		else {
			$('a.blockItem.settings').trigger("click");
			$(window.parent.document.body).find('.pageloader').remove();
			$('.sidebar').removeClass('sidebar-open').addClass('settingclosebtn');
		}
	}

	var ShowBlockUI = function () {
		$("#iframeHolder, #StyleToolManager, .Menupanel-top, #About, #Shortcuts").hide();
		$(".panel-top, #BlockManager, .block-set, #ContentBlocks").show();
	};

	//start data cleanup
	var VjCleanData = function (Data) {
		var Css = Data.css;
		var Content = Data.html;
		var Components = JSON.parse(Data.components);
		var Styles = JSON.parse(Data.styles);
		var Globalblocks = Data.globalblocks != undefined ? JSON.parse(Data.globalblocks) : '';
		var Ids = [];
		VjGetAllIds(Components, Ids);
		Styles = VjFilterStyle(Styles, Ids);
		var StyleIds = [];
		var GlobalKeyValuePairs = [];
		var GlobalStyleKeyValuePairs = [];
		VjRemoveGlobalBlockComponents(Components, StyleIds, GlobalKeyValuePairs, Globalblocks);
		VjRemoveGlobalBlockStyles(Styles, StyleIds, GlobalStyleKeyValuePairs);
		Content = VjRemoveGlobalBlockContent(Content);
		Css = VjFilterCss(Css, StyleIds);

		Data.css = Css;
		Data.html = Content;
		Data.components = JSON.stringify(Components);
		Data.styles = JSON.stringify(Styles);
		Data.globalblocks = JSON.stringify(Globalblocks);
		Data.globalkeyvaluepairs = JSON.stringify(GlobalKeyValuePairs);
		Data.globalstylekeyvaluepairs = GlobalKeyValuePairs.length > 0 ? JSON.stringify(GlobalStyleKeyValuePairs) : '';
		return Data;
	};
	var VjGetAllIds = function (contentJSON, ids) {
		if (contentJSON != undefined) {
			$.each(contentJSON, function (i, v) {
				if (v.attributes != null && v.attributes["id"] != undefined)
					ids.push(v.attributes["id"]);
				if (v.components != undefined)
					VjGetAllIds(v.components, ids);
			});
		}
	};
	var VjFilterStyle = function (styleJSON, ids) {
		if (styleJSON != undefined) {
			var itemsToRemove = [];
			$.each(styleJSON, function (i, v) {
				let selectorIds = [];
				if (v.selectors != undefined) {
					$.each(v.selectors, function (ii, vv) {
						if (vv.name != undefined)
							selectorIds.push(vv.name);
						else {
							try { selectorIds.push(vv.replace(/#/gi, "").replace(/\./gi, "")); } catch { }
						}
					});
				}
				let del = true;
				$.each(selectorIds, function (ii, vv) {
					if (ids.indexOf(vv) >= 0) {
						del = false;
						return false;
					}
				});
				if (del)
					itemsToRemove.push(v);
			});
			$.each(itemsToRemove, function (i, v) {
				const index = styleJSON.indexOf(v);
				if (index > -1) {
					styleJSON.splice(index, 1);
				}
			});
		}
		return styleJSON;
	};
	var VjRemoveGlobalBlockComponents = function (contentJSON, StyleIds, GlobalKeyValuePairs, DeserializedGlobalBlocksJSON) {
		if (contentJSON != null) {
			$.each(contentJSON, function (i, con) {
				if (con.type != undefined && (con.type == "module" || con.type == "blockwrapper")) {
					con.content = "";
				}
				else if (con.type != undefined && con.type == "globalblockwrapper") {
					if (con.attributes != undefined && con.attributes["data-guid"] != undefined && VjGetGlobalIndex(GlobalKeyValuePairs, con.attributes["data-guid"]) < 0) {
						let ccid = '';
						if (con.attributes["id"] != undefined)
							ccid = con.attributes["id"];
						if (VjIsGlobalBlockUnlocked(ccid, con.attributes["data-guid"], DeserializedGlobalBlocksJSON))
							GlobalKeyValuePairs.push({ guid: con.attributes["data-guid"], value: con.components });
						VjExtractStyleIds(con.attributes["data-guid"], con.components, StyleIds);
						delete con.components;
					}
				}
				else if (con.components != undefined) {
					VjRemoveGlobalBlockComponents(con.components, StyleIds, GlobalKeyValuePairs, DeserializedGlobalBlocksJSON);
				}
			});
		}
	};
	var VjIsGlobalBlockUnlocked = function (ccid, guid, blocksJSON) {
		var result = false;
		if (blocksJSON != undefined && blocksJSON.length > 0) {
			$.each(blocksJSON, function (i, con) {
				if (con.guid != undefined && con.guid == guid) {
					if (ccid != undefined && ccid.length > 0 && con.ccid != undefined) {
						if (con.ccid == ccid) {
							result = true;
							return false;
						}
					}
					else {
						result = true;
						return false;
					}
				}
			});
		}
		return result;
	};
	var VjExtractStyleIds = function (guid, components, styleIds) {
		if (components != undefined) {
			$.each(components, function (i, con) {
				if (con.attributes != undefined && con.attributes["id"] != undefined) {
					var styleIndex = VjGetGlobalIndex(styleIds, guid);
					if (styleIndex >= 0) {
						let existing = styleIds[styleIndex];
						existing.value.push(con.attributes["id"]);
						styleIds[styleIndex] = existing;
					}
					else {
						let obj = [];
						obj.push(con.attributes["id"]);
						styleIds.push({ guid: guid, value: obj });
					}
				}
				if (con.components != null) {
					VjExtractStyleIds(guid, con.components, styleIds);
				}
			});
		}
	};
	var VjRemoveGlobalBlockStyles = function (contentJSON, StyleIds, GlobalStyleKeyValuePairs) {
		if (contentJSON != null) {
			var itemsToRemove = [];
			$.each(contentJSON, function (i, con) {
				if (con.selectors != undefined) {
					$.each(con.selectors, function (i, cons) {
						var breaked = false;
						$.each(StyleIds, function (is, style) {
							try {
								if (cons != undefined && (cons.name != undefined && style.value.indexOf(cons.name) >= 0) || style.value.indexOf(cons.replace(/#/gi, "").replace(/\./gi, "")) >= 0) {
									var styleIndex = VjGetGlobalStyleIndex(itemsToRemove, style.guid);
									if (styleIndex >= 0) {
										var existing = itemsToRemove[styleIndex];
										existing.Value.push(con);
										itemsToRemove[styleIndex] = existing;
									}
									else {
										var obj = [];
										obj.push(con);
										itemsToRemove.push({ Key: style.guid, Value: obj });
									}
									breaked = true;
									return false;
								}
							}
							catch (err) { }
						});
						if (breaked)
							return false;
					});
				}
			});
			$.each(itemsToRemove, function (i, item) {
				$.each(item.Value, function (ii, con) {
					const index = contentJSON.indexOf(con);
					if (index > -1) {
						contentJSON.splice(index, 1);
					}
				});
				GlobalStyleKeyValuePairs.push({ Key: item.Key, Value: item.Value });
			});
		}
	};
	var VjGetGlobalIndex = function (contentJSON, guid) {
		var index = -1;
		$.each(contentJSON, function (i, item) {
			if (item.guid == guid) {
				index = i;
				return false;
			}
		});
		return index;
	};
	var VjGetGlobalStyleIndex = function (contentJSON, guid) {
		var index = -1;
		$.each(contentJSON, function (i, item) {
			if (item.Key == guid) {
				index = i;
				return false;
			}
		});
		return index;
	};
	var VjRemoveGlobalBlockContent = function (Content) {
		var markup = $('<div>' + Content + '</div>');
		markup.find('[data-block-type="global"]').html('');
		Content = markup.html();
		return Content;
	};
	var VjFilterCss = function (Css, StyleIds) {
		if (StyleIds.length > 0) {
			$.each(StyleIds, function (i, item) {
				$.each(item.value, function (ii, style) {
					var regexp = new RegExp("(#" + style + "*\s*{[^}]*})|(#" + style + ":[^{]*\s*{[^}]*})", 'ig');
					Css = Css.replace(regexp, '');
				});
			});
		}
		return Css;
	};
	//end data cleanup

	var GrapesjsDestroy = function () {
		if (VjEditor) {
			VjEditor.destroy();
			window.parent.location.reload();
		}
		else
			$(window.parent.document.body).find('.pageloader').remove();
	};

	var VjInit = function () {
		$.get(CurrentTabUrl, function (data) {
			var html = $.parseHTML(data);
			var dom = $(data);
			var newhtml = $(html).find('#dnn_ContentPane');
			$('#dnn_ContentPane').html('');
			$('#dnn_ContentPane').html($(newhtml).html());
			$('#dnn_ContentPane').removeClass("sidebar-open");
			var Scripts_Links = $(data).find('script');
			$.each(dom, function (i, v) {
				Scripts_Links.push(v);
			});
			$(window.parent.document).find('style[vjdataguid]').remove();
			InjectLinksAndScripts(Scripts_Links, window.document);
			setCookie("vj_InitUX", "true");
			if (window.location.href.indexOf('#') > 0 && window.location.href.split("#")[0] != CurrentTabUrl) {
				window.location.href = CurrentTabUrl.split('/uxmode')[0];
			}
			if ($(window).width() < 1260) {
				setTimeout(function () {
					$(window.parent.document.body).find('.gjs-cv-canvas__frames').addClass('deviceframe');
				}, 300);
			}
			$(this).find("em").addClass("fa-chevron-left").removeClass("fa-chevron-right");
			$('#dnn_ContentPane').addClass("sidebar-open").removeClass('sidebar-close');
			$('.sidebar').animate({ "left": "0" }, "fast").removeClass('settingclosebtn');
			$('.panel-top, .add-custom , #ContentBlocks').show();
			window.GrapesjsInit();
			DestroyAppActionMenu();
		});
	};
	$("#mode-switcher").click(function () {

		if ($(window.parent.document.body).find('.pageloader').length <= 0)
			$(window.parent.document.body).append('<div class="pageloader"><div class="modal-backdrop fade show"></div><img class="revisionloader revisionloaderimg" src="' + window.parent.VjDefaultPath + 'loading.svg" /></div>');

		if ($("#mode-switcher").offset().left > 0) {
			setCookie("vj_IsPageEdit", "false");
			setCookie("vj_InitUX", "false");
			GrapesjsDestroy();
			$(this).find("em").addClass("fa-chevron-right").removeClass("fa-chevron-left");
			$('#dnn_ContentPane').removeClass("sidebar-open").addClass('sidebar-close');
			$('.sidebar').animate({ "left": "-300px" }, "fast").addClass('settingclosebtn');
			$('.modal-toggle').hide();
			$('.uxmanager-modal').modal('hide');
			if (VjLayerpanel != null)
				VjLayerpanel.close();
			if (GetParameterByName('m2v', parent.window.location) != null && GetParameterByName('m2v', parent.window.location).startsWith('true')) {
				window.location.href = m2vPageTabUrl;
			}
		}
		else {
			setCookie("vj_IsPageEdit", "true");
			VjInit();
		}
	});

	$(".managetab a").click(function () {
		var $this = $(this).parent();
		if ($this.hasClass('traitstab')) {
			$('.traitmanage').removeClass('active');
			$(this).parent().addClass('active');
			$('.stylemanager').hide();
			$('.traitsmanager').show();
		}
		else {
			$('.traitmanage').removeClass('active');
			$(this).parent().addClass('active');
			$('.traitsmanager').hide();
			$('.stylemanager').show();
			$('.stylemanager .gjs-sm-sector').click(function () {
				var $this = $(this);
				var sectorName = $this.attr('class').split(' ')[1].replace("gjs-sm-sector__", "");
				if ($this.find('.gjs-sm-properties').is(':visible')) {
					$.each(VjEditor.StyleManager.getSectors().models, function (index, model) {
						model.set('open', false);
					});
					VjEditor.StyleManager.getSector(sectorName).set('open', true);
				}
			});
		}

		var selected = VjEditor.getSelected();
		VjEditor.select();
		VjEditor.select(selected);
	});

	$(".notification-set a").click(function () {
		var $this = $(this).parent();

		if ($this.hasClass('Texttab')) {
			$('.notificationtab').removeClass('active');
			$(this).parent().addClass('active');
			$('.Messageblock').hide();
			$('.Textblock').show();
		}
		else {
			$('.notificationtab').removeClass('active');
			$(this).parent().addClass('active');
			$('.Textblock').hide();
			$('.Messageblock').show();
		}
	});


	$(".blockstabview a").click(function () {
		var $this = $(this).parent();

		if ($this.hasClass('elementtab')) {
			$('.blockstab').removeClass('active');
			$(this).parent().addClass('active');
			ChangeBlockType();
		}
		else if ($this.hasClass('customtab')) {
			$('.blockstab').removeClass('active');
			$(this).parent().addClass('active');
			ChangeBlockType();
		}
		else if ($this.hasClass('librarytab')) {
			if (vjEditorSettings.TemplateLibraryURL != null && vjEditorSettings.TemplateLibraryURL != '')
				parent.OpenPopUp(null, '100%', 'center', VjLocalized.TemplateLibrary, vjEditorSettings.TemplateLibraryURL, '100%', true, false, null, false);
			else
				parent.OpenPopUp(null, '100%', 'center', VjLocalized.TemplateLibrary, TemplateLibraryURL, '100%', true, false, null, false);
		}
		else {
			$('.blockstab').removeClass('active');
			$(this).parent().addClass('active');
			ChangeBlockType();
		}
	});
	//Show Publish Options 
	//$(".draft-btn").click(function (e) {
	//    $('#DeviceManager').hide();

	//    if ($("#dnn_ContentPane").find(".gjs-frame").attr("style") == undefined)
	//        $("#dnn_ContentPane").find(".gjs-cv-canvas").removeAttr("style");

	//    $('#SettingButton').slideToggle(100);
	//    e.stopPropagation();
	//});

	$(document).click(function (e) {
		if ($(e.target).is('#DeviceManager *,.ntoolbox *')) {
			e.preventDefault();
			return;
		}
		$('#DeviceManager,#LanguageManager').hide();
		if ($("#dnn_ContentPane").find(".gjs-frame").attr("style") == undefined)
			$("#dnn_ContentPane").find(".gjs-cv-canvas").removeAttr("style");

		$('#SettingButton,#DeviceManager,#LanguageManager,.ntoolbox').hide();
	});

	//Change Device
	$(".device-manager .device-view").click(function () {
		var $this = $(this);
		var $body = $('body');
		var $iframe = $('.gjs-frame');

		$(".device-manager .device-view").removeClass("active");
		$this.addClass("active");

		$(".panelfooter .ResponsiveMode").find("em").removeClass(function (index, css) {
			return (css.match(/\bfa-\S+/g) || []).join(' ');
		}).addClass("fa-" + $this.attr("id").toLowerCase());

		//Desktop
		if ($this.attr("id") == "Desktop") {

			if (vjEditorSettings.ResponsiveStyling) {
				$iframe.removeClass("fixed-height");
				$iframe.contents().find("html").removeClass('responsive');
				$iframe.contents().find("html").removeClass('mobile-responsive');
				$iframe.removeClass('mobile-landscape-height');
				$iframe.contents().find("[data-gjs-type='wrapper']").removeClass("scrollbar");
				VjEditor.runCommand('set-device-desktop');
			}
			else
				$body.removeClass('resp-mode tablet mobile-portrait mobile-landscape').addClass('resp-mode');
		}
		//Tablet Portrait
		else if ($this.attr("id") == "Tablet") {

			if (vjEditorSettings.ResponsiveStyling) {
				$iframe.removeClass("fixed-height mobile-landscape-height");
				$iframe.contents().find("html").addClass('responsive');
				$iframe.contents().find("[data-gjs-type='wrapper']").addClass("scrollbar");
				$iframe.contents().find("html").removeClass('mobile-responsive');
				VjEditor.runCommand('set-device-tablet');
			}
			else
				$body.removeClass('mobile-portrait mobile-landscape').addClass('resp-mode tablet');
		}
		//Mobile Portrait
		else if ($this.attr("id") == "Mobile") {

			if (vjEditorSettings.ResponsiveStyling) {
				$iframe.addClass("fixed-height");
				$iframe.contents().find("html").addClass('responsive');
				$iframe.contents().find("html").removeClass('mobile-responsive');
				$iframe.removeClass('mobile-landscape-height');
				$iframe.contents().find("[data-gjs-type='wrapper']").addClass("scrollbar");
				VjEditor.runCommand('set-device-mobile-portrait');
			}
			else
				$body.removeClass('tablet mobile-landscape').addClass('resp-mode mobile-portrait');
		}

		//MobileLandscape
		else if ($this.attr("id") == "MobileLandscape") {

			if (vjEditorSettings.ResponsiveStyling) {
				$iframe.removeClass("fixed-height");
				$iframe.addClass("mobile-landscape-height");
				$iframe.contents().find("html").addClass('mobile-responsive');
				$iframe.contents().find("html").removeClass('responsive');
				$iframe.contents().find("[data-gjs-type='wrapper']").addClass("scrollbar");
				VjEditor.runCommand('set-device-mobile-landscape');
			}
			else {
				$body.removeClass('tablet mobile-portrait').addClass('resp-mode mobile-landscape');
			}
		}

		$('.gjs-frame-wrapper').on('transitionend webkitTransitionEnd oTransitionEnd', function () {
			var selected = VjEditor.getSelected();
			VjEditor.select();
			VjEditor.select(selected);
		});

	});

	var Stylemanager = function () {

		$("#BlockManager, #ContentBlocks, #Notification, #iframeHolder, #SettingButton, #DeviceManager,.ntoolbox, .panel-top, .block-set").hide();
		$("#StyleToolManager, .ssmanager").show();
	}

	$('.jsPanel-content').on("mousedown", function () {
		Stylemanager();
	});
});

if (document.addEventListener) {
	document.addEventListener('webkitfullscreenchange', exitHandler, false);
	document.addEventListener('mozfullscreenchange', exitHandler, false);
	document.addEventListener('fullscreenchange', exitHandler, false);
	document.addEventListener('MSFullscreenChange', exitHandler, false);
}

function RenderMarkup(name) {
	$.each(getAllComponents().filter(function (component) {
		return (component.attributes.name == name || component.attributes["custom-name"] != undefined && component.attributes["custom-name"] == name);
	}), function (index, value) {
		window.parent.RenderBlock(value);
	});
}

function exitHandler() {
	if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
		VjEditor.stopCommand("fullscreen");
		$(".Fullscreen").removeClass('active');
	}
}

global.RenderApp = function (iframe) {
	$(iframe).prev().hide();
	var model = window.parent.VjEditor.getSelected();
	iframe.style.height = iframe.contentWindow.document.body.offsetHeight + 'px';
	var AppMenusScript = $(iframe).contents().find('[data-actionmid]');
	if (!$('head').find('[data-actionmid=' + AppMenusScript.data("actionmid") + ']').length)
		$('head').append(AppMenusScript);
	var AppSettingsScript = $(iframe).contents().find('[data-settingsmid]');
	if (!$('head').find('[data-settingsmid=' + AppSettingsScript.data("settingsmid") + ']').length)
		$('head').append(AppSettingsScript);
	$(iframe.contentWindow.document.body).append('<style>.actionMenu {display: none !important;}</style>');
	VjEditor.select();
	model.initToolbar(true);
	setTimeout(function () {
		VjEditor.select(model);
	}, 0);

	iframe.contentWindow.document.body.addEventListener("DOMSubtreeModified", function () {
		iframe.style.height = this.offsetHeight + 'px';
	});

	if (iframe.src.indexOf('m2v') > -1) {
		$(iframe).contents().find(".style-wrapper").remove();
	}
}

global.ChangeColumnResizeSpeed = function (speed) {
	$(VjEditor.getComponents().where(x => x.attributes.type == 'grid')).each(function () {
		$(this.attributes.components.models[0].attributes.components.models).each(function () {
			var resizable = this.attributes.resizable;
			resizable.step = speed;
			this.set({ 'resizable': resizable });
		});
	});
}

global.getAllComponents = function (component) {
	component = component || editor.DomComponents.getWrapper();
	var components = component.get("components").models;
	component.get("components").forEach(function (component) {
		components = components.concat(getAllComponents(component));
	});

	return components;
};

global.ChangeBlockType = function (query) {
	var isGlobal = $('.globaltab').hasClass('active');
	var isCustom = $('.customtab').hasClass('active');
	var isLocal = $('.elementtab').hasClass('active');
	if (typeof VjEditor !== 'undefined' && VjEditor != undefined) {
		const blocks = VjEditor.BlockManager.getAll();
		var localBlocks = [];
		var globalBlocks = [];
		var customblocks = [];
		$.each(blocks.models, function (k, v) {
			if (v.attributes != undefined && v.attributes.attributes != undefined && v.attributes.attributes.isGlobalBlock != undefined && v.attributes.attributes.isGlobalBlock == true)
				globalBlocks.push(v);
			else if (v.attributes.attributes.isGlobalBlock == false)
				customblocks.push(v);
			else
				localBlocks.push(v);
		});

		if (query != undefined && query == 'search') {
			if (!isGlobal && !isCustom && isLocal)
				return localBlocks;
			else if (!isLocal && !isGlobal && isCustom)
				return customblocks;
			else
				return globalBlocks;
		}

		if (!isGlobal && !isCustom && isLocal && localBlocks.length)
			$('#ContentBlocks').empty().append(VjEditor.BlockManager.render(localBlocks));
		else if (!isLocal && !isGlobal && isCustom) {
			if (customblocks.length <= 0)
				$('#ContentBlocks').empty().append('<div class="empty_msg">' + VjLocalized.NoCustomBlockFound + '</div>');
			else
				$('#ContentBlocks').empty().append(VjEditor.BlockManager.render(customblocks));
		}
		else {
			if (globalBlocks.length <= 0)
				$('#ContentBlocks').empty().append('<div class="empty_msg">' + VjLocalized.NoBlockFound + '</div>');
			else
				$('#ContentBlocks').empty().append(VjEditor.BlockManager.render(globalBlocks));
		}
	}
};

function RunSaveCommand() {
	editor.StorageManager.getStorages().remote.attributes.params.IsPublished = true;
	if (GetParameterByName('m2v', parent.window.location) != null)
		editor.StorageManager.getStorages().remote.attributes.params.m2v = true;
	IsVJEditorSaveCall = true;
	editor.runCommand("save");
	editor.StorageManager.getStorages().remote.attributes.params.IsPublished = false;
	$('#VJBtnPublish').addClass('disabled');
	$($('.panelheader .blockItem')[1]).click();
	editor.StorageManager.getStorages().remote.attributes.params.Comment = "";
	$('#VJReviewComment', parent.document).val('');
};

global.ToggleBlockType = function (e, type) {
	if (!$('#' + e.id).hasClass('disabled')) {
		if (type == 'yes') {
			$(e).attr('class', 'btn btn-primary active');
			$(e).next().attr('class', 'btn btn-default');
		}
		else {
			$(e).attr('class', 'btn btn-primary disabled');
			$(e).prev().attr('class', 'btn btn-default');
		}
	}
};

global.UnlockGlobalBlock = function ($this) {

	if (IsAdmin) {
		swal({
			title: VjLocalized.AreYouSure,
			text: VjLocalized.GlobalBlockUnlocking,
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: VjLocalized.ReviewYES,
			cancelButtonText: VjLocalized.Cancel,
			closeOnConfirm: true,
			closeOnCancel: true
		},
			function (isConfirm) {
				if (isConfirm) {
					$this.parents('[data-gjs-type="globalblockwrapper"]').css('pointer-events', 'auto');
					$this.parents('.global-tools').remove();
				}
			});
	}
	else {
		swal(VjLocalized.GlobalBlockUnlockingError);
	}
}

global.ViewBlockRevisions = function (Guid) {
	if (Guid != undefined && Guid != '') {
		var revisionsrc = CurrentExtTabUrl + "&guid=e2f6ebcb-5d68-4d85-b180-058fb2d26178#!/revisions/" + Guid;

		$('#iframeHolder').find('iframe').attr('src', 'about:blank');
		setTimeout(function () {
			$("#BlockManager").hide();
			$("#StyleToolManager").hide();
			$("#iframeHolder").fadeIn();
		}, 300);
		$('#iframeHolder').find('iframe').attr('src', revisionsrc);
	}
}

global.getUrlVars = function () {

	var output = new Array();

	if (location.search == "") {
		var qs = location.pathname;
		//strip leading path slash
		qs = qs.substring(1);
		var a = qs.split('/');
		var i;
		for (i = 0; i < a.length; i += 2) {
			//append key->value pairs to output array
			output[a[i]] = a[i + 1];
		}
	}
	else {
		var hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			output.push(hash[0]);
			if (typeof hash[1] == 'undefined')
				output[hash[0]] = null;
			else
				output[hash[0]] = hash[1];
		}
	}

	return output;
}

// start review toast 
global.ConfirmReviewChange = function (FirstStateName) {
	swal({
		title: VjLocalized.ReviewAreYouSure,
		text: VjLocalized.ReviewUnlockingThePage + " " + FirstStateName,
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55", confirmButtonText: VjLocalized.ReviewYES,
		cancelButtonText: VjLocalized.ReviewNO,
		closeOnConfirm: true,
		closeOnCancel: true
	},
		function (isConfirm) {
			if (isConfirm) {
				$('.gjs-cv-canvas__frames').removeClass('lockcanvas');
				VJIsLocked = 'False';
				$('.toast-close-button').click();
				editor.StorageManager.getStorages().remote.attributes.params.IsPublished = false;
				editor.StorageManager.getStorages().remote.attributes.params.Comment = '';
				editor.runCommand("save");
				$('#VJBtnPublish').removeClass('disabled');
			}
		});
}
// end review toast

global.ChangeToWebp = function (target, URLs) {

	if (typeof target != 'undefined' && target.attributes.type == "picture-box") {

		var markup = "", maxWidth = "";

		var webp = jQuery.grep(URLs, function (n, i) {
			return (n.Type == 'webp');
		});

		var srcWebp = "";

		$(webp).each(function (index, value) {

			if (index == 0)
				maxWidth = value.Width;

			srcWebp += value.Url + ' ' + value.Width + 'w';

			if (webp.length != index + 1) {
				srcWebp += ',';
			}

		});

		var sourceWebp = document.createElement('source');
		sourceWebp.setAttribute("class", "source");
		sourceWebp.setAttribute("type", "image/webp");
		sourceWebp.setAttribute("srcset", srcWebp);

		var image = jQuery.grep(URLs, function (n, i) {
			return (n.Type != 'webp');
		});

		var srcImage = "";

		$(image).each(function (index, value) {

			srcImage += value.Url + ' ' + value.Width + 'w';

			if (webp.length != index + 1)
				srcImage += ',';

		});

		var sourceImg = document.createElement('source');
		sourceImg.setAttribute("class", "source");
		sourceImg.setAttribute("srcset", srcImage);

		markup += sourceWebp.outerHTML + sourceImg.outerHTML;

		var img = '', style = '';

		if (target.view.$el.find('img').length)
			img = target.view.$el.find('img')[0].outerHTML

		if (target.components().length) {

			$(target.components().models).each(function (index, item) {

				if (item.attributes.type == "image" || item.attributes.type == "image-gallery-item") {

					if (target.components().models[2] != undefined)
						window.document.vj_image_target = target.components().models[2];
					else
						window.document.vj_image_target = target.components().models[0];

					style = item.getStyle();
					style['max-width'] = maxWidth + 'px';
				}
			});
		}

		target.components([]);
		target.append(markup + img);

		$(target.components().models).each(function (index, item) {

			if (item.attributes.type == "image" || item.attributes.type == "image-gallery-item")
				target.components().models[2].setStyle(style);

		});
	}
}

global.FilterBorderOptions = function (target, position) {

	setTimeout(function () {

		var val;

		switch (position) {
			case "sm-border-top":
				val = "border-top"
				break;
			case "sm-border-right":
				val = "border-right"
				break;
			case "sm-border-bottom":
				val = "border-bottom"
				break;
			case "sm-border-left":
				val = "border-left"
				break;
			default:
				val = "border"
		}

		var sm = VjEditor.StyleManager;
		var Border = VjLocalized.Border.replace(/ /g, '_').toLowerCase();

		$(sm.getProperties(Border).models).each(function () {
			if (this.attributes.name != 'Border Postion')
				this.view.$el.hide();
		});

		$(sm.getProperty(Border, val + '-style').view.el).show();
		$(sm.getProperty(Border, val + '-color').view.el).show();
		$(sm.getProperty(Border, val + '-width').view.el).show();

		var style = val + '-style';

		if (typeof target.getStyle()[style] == "undefined")
			sm.getProperty(Border, style).view.$el.find('input').prop('checked', false);

		var width = val + '-width';

		if (typeof target.getStyle()[width] == "undefined")
			sm.getProperty(Border, width).view.$el.find('input').val(0);

		var color = val + '-color';

		if (typeof target.getStyle()[color] == "undefined") {

			var brdcolor = target.getStyle()[color];

			if (typeof brdcolor == "undefined")
				brdcolor = $(target.getEl()).css('color');

			sm.getProperty(Border, color).view.$el.find('input').val(brdcolor);
			sm.getProperty(Border, color).view.$el.find('.gjs-field-color-picker').css('background-color', brdcolor);
		}

		setTimeout(function () {

			var borderStyle = target.getStyle()['border-top-style'];
			var borderColor = target.getStyle()['border-top-color'];
			var borderWidth = target.getStyle()['border-top-width'];

			if (typeof borderStyle != 'undefined' && borderStyle == target.getStyle()['border-bottom-style'] && borderStyle == target.getStyle()['border-left-style'] && borderStyle == target.getStyle()['border-right-style'])
				$(sm.getProperty(Border, 'border-style').view.$el).find('input[value= ' + borderStyle + ']').prop('checked', true);


			if (typeof borderColor != 'undefined' && borderColor == target.getStyle()['border-bottom-color'] && borderColor == target.getStyle()['border-left-color'] && borderColor == target.getStyle()['border-right-color']) {
				$(sm.getProperty(Border, 'border-color').view.$el).find('input').val(borderColor);
				sm.getProperty(Border, color).view.$el.find('.gjs-field-color-picker').css('background-color', borderColor);
			}


			if (typeof borderWidth != 'undefined' && borderWidth == target.getStyle()['border-bottom-width'] && borderWidth == target.getStyle()['border-left-width'] && borderWidth == target.getStyle()['border-right-width'])
				$(sm.getProperty(Border, 'border-width').view.$el).find('input').val(parseInt(borderWidth));

		});
	});
}
