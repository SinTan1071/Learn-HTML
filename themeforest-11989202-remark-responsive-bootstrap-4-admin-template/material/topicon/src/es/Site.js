import $ from 'jquery';
import * as Config from 'Config';
import Base from 'Base';
import Menubar from 'Menubar';
import Sidebar from 'Sidebar';
import PageAside from 'PageAside';

const DOC = document;
const $DOC = $(document);
const $BODY = $('body');

class Site extends Base {
  willProcess() {
    this.startLoading();
    this.initializePluginAPIs();
    this.initializePlugins();
  }

  processed() {
    this.polyfillIEWidth();
    this.initBootstrap();

    this.setupMenubar();
    this.setupFullScreen();
    this.setupMegaNavbar();
    this.setupWave();
    this.setupTour();
    this.setupNavbarCollpase();
    // Dropdown menu setup
    // ===================
    this.$el.on('click', '.dropdown-menu-media', (e) => {
      e.stopPropagation();
    });
  }

  _getDefaultMeunbarType() {
    return 'hide';
  }

  getDefaultState() {
    let menubarType = this._getDefaultMeunbarType();

    return {
      menubarType
    };
  }

  getDefaultActions() {
    return {
      menubarType(type) {
        $('[data-toggle="menubar"]').each(function() {
          let $this = $(this);
          let $hamburger = $(this).find('.hamburger');

          if ($hamburger.length > 0) {
            $hamburger.toggleClass('hided', !(type === 'open'));
          } else {
            $this.toggleClass('hided', !(type === 'open'));
          }
        });
      }
    };
  }

  getDefaultChildren() {
    this.menubar = new Menubar({
      $el: $('.site-menubar')
    });

    this.sidebar = new Sidebar();
    let children = [this.menubar, this.sidebar];
    let $aside = $('.page-aside');
    if ($aside.length > 0) {
      children.push(new PageAside({
        $el: $aside
      }));
    }
    return children;
  }

  getCurrentBreakpoint() {
    let bp = Breakpoints.current();
    return bp ? bp.name : 'lg';
  }

  initBootstrap() {
    // Tooltip setup
    // =============
    $DOC.tooltip({
      selector: '[data-tooltip=true]',
      container: 'body'
    });

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover();
  }

  polyfillIEWidth() {
    if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
      let msViewportStyle = DOC.createElement('style');
      msViewportStyle.appendChild(
        DOC.createTextNode(
          '@-ms-viewport{width:auto!important}'
        )
      );
      DOC.querySelector('head').appendChild(msViewportStyle);
    }
  }

  setupFullScreen() {
    if (typeof screenfull !== 'undefined') {
      $DOC.on('click', '[data-toggle="fullscreen"]', () => {
        if (screenfull.enabled) {
          screenfull.toggle();
        }

        return false;
      });

      if (screenfull.enabled) {
        DOC.addEventListener(screenfull.raw.fullscreenchange, () => {
          $('[data-toggle="fullscreen"]').toggleClass('active', screenfull.isFullscreen);
        });
      }
    }
  }

  setupMegaNavbar() {
    $DOC.on('click', '.navbar-mega .dropdown-menu', (e) => {
      e.stopPropagation();
    }).on('show.bs.dropdown', (e) => {
      let $target = $(e.target);
      let $trigger = e.relatedTarget ? $(e.relatedTarget) : $target.children('[data-toggle="dropdown"]');
      let animation = $trigger.data('animation');

      if (animation) {
        let $menu = $target.children('.dropdown-menu');
        $menu
          .addClass(`animation-${animation}`)
          .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
            $menu.removeClass(`animation-${animation}`);
          });
      }
    }).on('shown.bs.dropdown', (e) => {
      let $menu = $(e.target).find('.dropdown-menu-media > .list-group');

      if ($menu.length > 0) {
        let api = $menu.data('asScrollable');
        if (api) {
          api.update();
        } else {
          $menu.asScrollable({
            namespace: 'scrollable',
            contentSelector: '> [data-role=\'content\']',
            containerSelector: '> [data-role=\'container\']'
          });
        }
      }
    });
  }
  setupNavbarCollpase() {
    $(document).on('click', "[data-target='#site-navbar-collapse']", function(e) {
      let $trigger = $(this);
      let isClose = $trigger.hasClass('collapsed');
      $BODY.addClass("site-navbar-collapsing");
      $BODY.toggleClass("site-navbar-collapse-show", !isClose);
      setTimeout(() => {
        $BODY.removeClass("site-navbar-collapsing");
      }, 350);
    });
  }
  setupMenubar() {
    $(document).on('click', '[data-toggle="menubar"]', () => {
      let type = this.getState('menubarType');
      switch (type) {
        case 'open':
          type = 'hide';
          break;
        case 'hide':
          type = 'open';
          break;
          // no default
      }

      this.setState('menubarType', type);

      return false;
    });

    $(document).on('collapsed.site.menu expanded.site.menu', () => {
      let type = this.getState('menubarType');

      if (type === 'open' && this.menubar && this.menubar.scrollable) {
        this.menubar.scrollable.update();
      }
    });

    Breakpoints.on('change', () => {
      this.setState('menubarType', this._getDefaultMeunbarType());
    });
  }
  setupWave() {
    if (typeof Waves !== 'undefined') {
      Waves.init();
      Waves.attach('.site-menu-item > a', ['waves-classic']);
      Waves.attach(".site-navbar .navbar-toolbar a", ["waves-light", "waves-round"]);
      Waves.attach('.btn', ['waves-light', 'waves-round']);
    }
  }
  startLoading() {
    if (typeof $.fn.animsition === 'undefined') {
      return false;
    }

    // let loadingType = 'default';
    $BODY.animsition({
      inClass: 'fade-in',
      inDuration: 800,
      loading: true,
      loadingClass: 'loader-overlay',
      loadingParentElement: 'html',
      loadingInner: `
      <div class="loader-content">
        <div class="loader-index">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>`,
      onLoadEvent: true
    });
  }

  setupTour(flag) {
    if (typeof this.tour === 'undefined') {
      if (typeof introJs === 'undefined') {
        return;
      }
      let overflow = $('body').css('overflow'),
        self = this,
        tourOptions = Config.get('tour');

      this.tour = introJs();

      this.tour.onbeforechange(() => {
        $('body').css('overflow', 'hidden');
      });

      this.tour.oncomplete(() => {
        $('body').css('overflow', overflow);
      });

      this.tour.onexit(() => {
        $('body').css('overflow', overflow);
      });

      this.tour.setOptions(tourOptions);
      $('.site-tour-trigger').on('click', () => {
        self.tour.start();
      });
    }
  }
}

let instance = null;

function getInstance() {
  if (!instance) {
    instance = new Site();
  }
  return instance;
}

function run() {
  let site = getInstance();
  site.run();
}

export default Site;
export {
  Site,
  run,
  getInstance
};
