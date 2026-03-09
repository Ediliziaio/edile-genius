import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const BlogCTA = () => (
  <div className="mt-16 rounded-2xl bg-primary/5 border border-primary/20 p-8 md:p-10 text-center space-y-4">
    <h3 className="text-2xl font-bold text-foreground">Pronto a trasformare la tua impresa edile?</h3>
    <p className="text-muted-foreground max-w-lg mx-auto">
      Scopri come Edilizia.io può automatizzare le chiamate, qualificare i lead e aumentare il fatturato della tua azienda.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
      <Link
        to="/tariffe"
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
      >
        Vedi le Tariffe <ArrowRight size={16} />
      </Link>
      <Link
        to="/soluzioni"
        className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-bold hover:bg-muted transition-colors"
      >
        Scopri le Soluzioni
      </Link>
    </div>
  </div>
);

export default BlogCTA;
