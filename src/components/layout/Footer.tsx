export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} FlyCargo Web. All rights reserved.</p>
        <p className="text-sm mt-1">Powered by Fly Cargo Lanka</p>
      </div>
    </footer>
  );
}
