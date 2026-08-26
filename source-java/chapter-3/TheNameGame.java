public class TheNameGame {
	public static void main(String[] args){
        Scanner scan = new Scanner(System.in);
        System.out.print("What is your name? ");
        String first = scan.next();
        String last = scan.next();
        
        method(first);
        System.out.println();
        method(last);
    
    }
    
    public static void method(String name){
        System.out.println(name + " " + name + ", bo-" + name.replace(name.charAt(0), 'B'));
        System.out.println("Banana-fana fo-" + name.replace(name.charAt(0), 'F'));
        System.out.println("Fee-fi-mo-" + name.replace(name.charAt(0), 'M'));
        System.out.println(name.toUpperCase() + "!");
    }
}