public class DateTime {
    private int year, month, day, hour, minute;

    private static int days_in_month(int month, int year){
        switch ((month - 1) % 12 + 1) {
            case 1, 3, 5, 7, 8, 10, 12:
                return 31;
            case 2:
                if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0))
                    return 29;
                else
                    return 28;
            default:
                return 30;
        }
    }

    public DateTime(int year, int month, int day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    public DateTime(int year, int month, int day, int hour, int minute) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getDay() {
        return day;
    }

    public void setDay(int day) {
        this.day = day;
    }

    public int getHour() {
        return hour;
    }

    public void setHour(int hour) {
        this.hour = hour;
    }

    public int getMinute() {
        return minute;
    }

    public void setMinute(int minute) {
        this.minute = minute;
    }

    void add(DateTime to_add) {
        // Adding the minutes
        int new_time = to_add.getMinute() + this.getMinute();
        int add_next = new_time / 60; new_time = new_time % 60;
        this.setMinute(new_time);

        // Adding the hours
        new_time = to_add.getHour() + this.getHour() + add_next;
        add_next = new_time / 24; new_time = new_time % 24;
        this.setHour(new_time);

        // Adding the days
        // Assumes 30 days in every month
        new_time = to_add.getDay() + this.getDay() + add_next;
        add_next = new_time / days_in_month(this.month, this.year); new_time = new_time % 30;
        this.setDay(new_time);

        // Adding the months
        new_time = to_add.getMonth() + this.getMonth() + add_next;
        add_next = new_time / 12; new_time = new_time % 12;
        this.setMonth(new_time);

        // Adding the years
        new_time = to_add.getYear() + this.getYear() + add_next;
        this.setYear(new_time);
    }

    DateTime datetimediff(DateTime to_subtract) {
        DateTime output = new DateTime(1970, 1, 1);
        

        return new DateTime(1970,1,1);
    }

    @Override
    public String toString() {
        return "DateTime{" +
                "year=" + year +
                ", month=" + month +
                ", day=" + day +
                ", hour=" + hour +
                ", minute=" + minute +
                '}';
    }

    public static void main(String[] args) {
        DateTime dt = new DateTime(2024, 2, 1, 0,0);
        dt.add(new DateTime(0,0,31,0,500));
        System.out.println(dt);
//        int year = 2000;
//        System.out.println("Number of days in each month in the year " + year);
//        System.out.println("M\tD");
//        for (int month = 1; month <= 12; month++) {
//            System.out.print(month);
//            System.out.print('\t');
//            System.out.println(days_in_month(month,year));
//        }
    }
}
