import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const scrollToElement = () => {
        const element = document.getElementById(targetId);
        if (element) {
          const navbarOffset = 85;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

          window.scrollTo({
            top: offsetPosition >= 0 ? offsetPosition : 0,
            behavior: 'smooth'
          });
          return true;
        }
        return false;
      };

      if (!scrollToElement()) {
        const t1 = setTimeout(scrollToElement, 80);
        const t2 = setTimeout(scrollToElement, 300);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [pathname, search, hash]);

  return null;
}
