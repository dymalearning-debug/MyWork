-- The limits of the Tableaux module lock the parent row and count every row, whatever the rights
-- of the user who adds one: the check runs as its owner.
alter function public.check_board_limits() security definer;
