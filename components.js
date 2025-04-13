class Footer extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <footer class="min-height-two-thirds">
          <p>© ${new Date().getFullYear()} My Site. All rights reserved.</p>
          <nav>
            <a href="/about">About</a> | <a href="/contact">Contact</a>
          </nav>
        </footer>
      `;
    }
  }
  customElements.define('bh-footer', Footer);

  class Nav extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <nav>
          <ul>
            <li><a href="./index.html">Home</a></li>
            <li>
              Portfolio
              <div>
                <a href="./portfolio/photography.html">Photography</a>
                <a href="./portfolio/video.html">Video</a>
              </div>
            </li>
            <li><a href="./investment.html">Investment</a></li>
            <li><a href="./blog.html">Blog</a></li>
            <li><a href="./contact.html">Contact</a></li>
            <li><a href="./about.html">About</a></li>
          </ul>
          <i class="fa-sharp fa-light fa-bars font-size-medium"></i>
        </nav>
      `;
    }
  }
  customElements.define('bh-nav', Nav);