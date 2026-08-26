public class Football {
    public static void main(String[] args) {
        DrawingPanel panel = new DrawingPanel(250, 250);
        Graphics g = panel.getGraphics();
        g.setColor(Color.black);
		    g.drawRect(10, 30, 200, 200);
		    for(int i = 0; i < 20; i++) {
            int x1 = 10;
		       	int y1 = 220 - 10 * i;
			      int x2 = 20 + 10 * i;
			      int y2 = 30;
		        g.drawLine(x1, y1, x2, y2);
		        g.drawLine(x2, 230, 210, y1);
        }
    }
}