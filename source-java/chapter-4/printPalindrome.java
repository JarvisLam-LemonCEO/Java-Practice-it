/*
* Write a method called printPalindrome that accepts a Scanner for the console 
* as a parameter, and prompts the user to enter one or more words and prints 
* whether the entered String is a palindrome
*/

public static void printPalindrome(Scanner console) {
        System.out.print("Type one or more words: ");
        String word = console.nextLine();
        String string = word.toLowerCase();
        int i = 0;
        int j = word.length() - 1;
        while(i < j) {
        if(string.charAt(i) != string.charAt(j)) {
            System.out.println(word + " is not a palindrome.");
            return;
        }
            i++;
            j--;
        }
            System.out.println(word + " is a palindrome!");
    }