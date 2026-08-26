public static String stutter(String string) {
		String s = "";
		for(int i = 0; i < string.length(); i++) {
			s = s + string.charAt(i) + string.charAt(i);
			
		}
		return s;
	}